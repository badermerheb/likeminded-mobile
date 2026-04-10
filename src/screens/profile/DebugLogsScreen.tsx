// src/screens/profile/DebugLogsScreen.tsx
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Share,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../theme/ThemeContext';
import type {ThemeColors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing, borderRadius} from '../../theme/spacing';
import {api} from '../../services/api';
import {
  getLogs,
  clearLogs,
  subscribeLogs,
  type LogEntry,
} from '../../services/logCapture';

type Tab = 'mobile' | 'backend';
type FilterLevel = 'all' | 'log' | 'warn' | 'error' | 'info';

interface BackendLog {
  ts: string;
  level: string;
  logger: string;
  message: string;
}

export const DebugLogsScreen: React.FC = () => {
  const {colors} = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [tab, setTab] = useState<Tab>('backend');
  const [filter, setFilter] = useState<FilterLevel>('all');

  // Mobile logs
  const [mobileLogs, setMobileLogs] = useState<LogEntry[]>(getLogs);

  // Backend logs
  const [backendLogs, setBackendLogs] = useState<BackendLog[]>([]);
  const [backendLoading, setBackendLoading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);

  // Subscribe to mobile log updates
  useEffect(() => {
    const unsub = subscribeLogs(() => setMobileLogs([...getLogs()]));
    return unsub;
  }, []);

  // Fetch backend logs
  const fetchBackendLogs = useCallback(async () => {
    setBackendLoading(true);
    setBackendError(null);
    try {
      const data = await api.get<BackendLog[]>('/__debug/logs', {limit: 300});
      setBackendLogs(data);
    } catch (err: any) {
      setBackendError(err.message || 'Failed to fetch backend logs');
    } finally {
      setBackendLoading(false);
    }
  }, []);

  // Auto-fetch backend logs when switching to backend tab
  useEffect(() => {
    if (tab === 'backend') {
      fetchBackendLogs();
    }
  }, [tab]);

  // Unified log items for FlatList
  const filteredItems = useMemo(() => {
    if (tab === 'mobile') {
      let result = mobileLogs;
      if (filter !== 'all') {
        result = result.filter(l => l.level === filter);
      }
      return result
        .map(l => ({
          id: String(l.id),
          level: l.level.toUpperCase(),
          time: l.timestamp.toLocaleTimeString(),
          message: l.message,
          source: l.level,
        }))
        .reverse();
    } else {
      let result = backendLogs;
      if (filter !== 'all') {
        const f = filter.toUpperCase();
        const levelMap: Record<string, string[]> = {
          ERROR: ['ERROR', 'CRITICAL'],
          WARN: ['WARNING', 'WARN'],
          INFO: ['INFO'],
          LOG: ['DEBUG'],
        };
        const allowed = levelMap[f] || [f];
        result = result.filter(l => allowed.includes(l.level));
      }
      return result.map((l, i) => ({
        id: `b-${i}`,
        level: l.level,
        time: new Date(l.ts).toLocaleTimeString(),
        message: l.message,
        source: l.logger,
      }));
    }
  }, [tab, mobileLogs, backendLogs, filter]);

  const handleClear = useCallback(() => {
    if (tab === 'mobile') {
      clearLogs();
      setMobileLogs([]);
    } else {
      api
        .request('DELETE', '/__debug/logs')
        .then(() => setBackendLogs([]))
        .catch(() => {});
    }
  }, [tab]);

  const handleShare = useCallback(async () => {
    const shareText = filteredItems
      .slice(0, 300)
      .map(l => `[${l.time}] [${l.level}] ${l.message}`)
      .join('\n');
    try {
      await Share.share({
        message: shareText,
        title: `${tab === 'mobile' ? 'Mobile' : 'Backend'} Logs`,
      });
    } catch {}
  }, [filteredItems, tab]);

  const levelColor = (level: string) => {
    const upper = level.toUpperCase();
    if (upper === 'ERROR' || upper === 'CRITICAL') return '#FF4444';
    if (upper === 'WARNING' || upper === 'WARN') return '#FFAA00';
    if (upper === 'INFO') return '#44AAFF';
    if (upper === 'DEBUG') return '#88CC88';
    return colors.textSecondary;
  };

  const renderItem = useCallback(
    ({item}: {item: (typeof filteredItems)[0]}) => (
      <View style={styles.logRow}>
        <View style={styles.logHeader}>
          <Text style={[styles.logLevel, {color: levelColor(item.level)}]}>
            {item.level}
          </Text>
          <Text style={styles.logTime}>{item.time}</Text>
        </View>
        <Text style={styles.logMessage} selectable>
          {item.message}
        </Text>
      </View>
    ),
    [styles, colors],
  );

  const FILTERS: FilterLevel[] = ['all', 'log', 'warn', 'error', 'info'];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, tab === 'backend' && styles.tabActive]}
          onPress={() => setTab('backend')}>
          <Icon
            name="server-outline"
            size={16}
            color={tab === 'backend' ? '#fff' : colors.textSecondary}
          />
          <Text
            style={[styles.tabText, tab === 'backend' && styles.tabTextActive]}>
            Backend
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'mobile' && styles.tabActive]}
          onPress={() => setTab('mobile')}>
          <Icon
            name="phone-portrait-outline"
            size={16}
            color={tab === 'mobile' ? '#fff' : colors.textSecondary}
          />
          <Text
            style={[styles.tabText, tab === 'mobile' && styles.tabTextActive]}>
            Mobile
          </Text>
        </TouchableOpacity>
      </View>

      {/* Test Push button */}
      {tab === 'backend' && (
        <TouchableOpacity
          style={styles.testPushBtn}
          onPress={async () => {
            try {
              const res = await api.post<{ok: boolean; message?: string; error?: string}>('/__debug/test-push');
              console.log('[TestPush] Response:', JSON.stringify(res));
              // Auto-refresh logs after a moment
              setTimeout(fetchBackendLogs, 2000);
            } catch (err: any) {
              console.error('[TestPush] Failed:', err.message);
            }
          }}>
          <Icon name="notifications-outline" size={18} color="#fff" />
          <Text style={styles.testPushText}>Send Test Push</Text>
        </TouchableOpacity>
      )}

      {/* Filter bar */}
      <View style={styles.filterBar}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}>
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}>
              {f.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Action bar */}
      <View style={styles.actionBar}>
        <Text style={styles.countText}>{filteredItems.length} entries</Text>
        <View style={styles.actionButtons}>
          {tab === 'backend' && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={fetchBackendLogs}>
              <Icon name="refresh-outline" size={18} color={colors.primary} />
              <Text style={styles.actionBtnText}>Refresh</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <Icon name="share-outline" size={18} color={colors.primary} />
            <Text style={styles.actionBtnText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleClear}>
            <Icon name="trash-outline" size={18} color="#FF4444" />
            <Text style={[styles.actionBtnText, {color: '#FF4444'}]}>
              Clear
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Backend loading / error */}
      {tab === 'backend' && backendLoading && (
        <View style={styles.loadingBar}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching backend logs...</Text>
        </View>
      )}
      {tab === 'backend' && backendError && (
        <View style={styles.errorBar}>
          <Icon name="alert-circle" size={16} color="#FF4444" />
          <Text style={styles.errorText}>{backendError}</Text>
        </View>
      )}

      {/* Log list */}
      <FlatList
        ref={flatListRef}
        data={filteredItems}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon
              name="document-text-outline"
              size={48}
              color={colors.textDisabled}
            />
            <Text style={styles.emptyText}>
              {tab === 'backend' && backendLoading
                ? 'Loading...'
                : 'No logs yet'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.background,
    },
    tabBar: {
      flexDirection: 'row',
      marginHorizontal: spacing.md,
      marginTop: spacing.sm,
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      padding: 3,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      gap: 6,
    },
    tabActive: {
      backgroundColor: c.primary,
    },
    tabText: {
      ...typography.subhead,
      color: c.textSecondary,
      fontWeight: '600',
    },
    tabTextActive: {
      color: '#fff',
    },
    testPushBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginHorizontal: spacing.md,
      marginTop: spacing.sm,
      paddingVertical: spacing.sm,
      backgroundColor: '#22AA44',
      borderRadius: borderRadius.md,
    },
    testPushText: {
      ...typography.subhead,
      color: '#fff',
      fontWeight: '700',
    },
    filterBar: {
      flexDirection: 'row',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.xs,
    },
    filterChip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    filterChipActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    filterText: {
      ...typography.caption1,
      color: c.textSecondary,
      fontWeight: '600',
    },
    filterTextActive: {
      color: '#fff',
    },
    actionBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    countText: {
      ...typography.caption1,
      color: c.textDisabled,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    actionBtnText: {
      ...typography.caption1,
      color: c.primary,
      fontWeight: '600',
    },
    loadingBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    loadingText: {
      ...typography.caption1,
      color: c.textSecondary,
    },
    errorBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    errorText: {
      ...typography.caption1,
      color: '#FF4444',
    },
    listContent: {
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.xl,
    },
    logRow: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    logHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    logLevel: {
      ...typography.caption2,
      fontWeight: '700',
      fontFamily: 'monospace',
    },
    logTime: {
      ...typography.caption2,
      color: c.textDisabled,
      fontFamily: 'monospace',
    },
    logMessage: {
      ...typography.caption1,
      color: c.textPrimary,
      fontFamily: 'monospace',
      lineHeight: 16,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 100,
      gap: spacing.sm,
    },
    emptyText: {
      ...typography.body,
      color: c.textDisabled,
    },
  });
