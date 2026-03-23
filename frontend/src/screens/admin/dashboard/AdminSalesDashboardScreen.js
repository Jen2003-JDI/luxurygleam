import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions,} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { fetchSalesAnalytics, setYear } from '../../../redux/slices/admin/analyticsSlice';
import { COLORS, SPACING, BORDER_RADIUS } from '../../../constants/theme';
import ScreenHeader from '../../../components/ui/ScreenHeader';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - SPACING.base * 2 - SPACING.md * 2;

const CHART_CONFIG = {
  backgroundGradientFrom: COLORS.card,
  backgroundGradientTo: COLORS.card,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(201, 168, 76, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(245, 237, 218, ${opacity})`,
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: COLORS.primary,
  },
  propsForBackgroundLines: {
    stroke: COLORS.border,
    strokeDasharray: '4',
  },
  propsForLabels: {
    fontSize: 10,
  },
  barPercentage: 0.58,
};

const PIE_COLORS = [
  COLORS.primary, '#5B8DE0', '#52C478', '#E07A30',
  '#9B5BE0', '#E05252', '#E0C830', '#30C4E0',
];

const STATUS_COLORS_MAP = {
  Pending: '#E0A830', Processing: '#5B8DE0', Shipped: '#9B5BE0',
  'Out for Delivery': '#E07A30', Delivered: '#52C478',
  Cancelled: '#E05252', Refunded: '#808080',
};

export default function AdminSalesDashboardScreen({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { summary, months, topProducts, categoryStats, statusBreakdown, year, loading, error } = useSelector((s) => s.analytics);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { dispatch(fetchSalesAnalytics(year)); }, [year]);

  const handleYearChange = (delta) => {
    const newYear = year + delta;
    dispatch(setYear(newYear));
    dispatch(fetchSalesAnalytics(newYear));
  };

  // Format currency compactly
  const fmt = (n) => n >= 1000000
    ? `₱${(n / 1000000).toFixed(1)}M`
    : n >= 1000 ? `₱${(n / 1000).toFixed(0)}K`
    : `₱${Math.round(n)}`;

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'revenue', label: 'Revenue' },
    { key: 'products', label: 'Products' },
    { key: 'orders', label: 'Orders' },
    { key: 'reports', label: 'Reports' },
  ];

  const safeSummary = summary || {
    totalRevenue: 0,
    totalOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    avgOrderValue: 0,
  };
  const totalOrdersForRate = safeSummary.totalOrders || statusBreakdown.reduce((sum, s) => sum + s.count, 0);
  const deliveryRate = totalOrdersForRate > 0
    ? Math.round((safeSummary.deliveredOrders / totalOrdersForRate) * 100)
    : 0;
  const cancelRate = totalOrdersForRate > 0
    ? Math.round((safeSummary.cancelledOrders / totalOrdersForRate) * 100)
    : 0;

  const activeMonths = months.filter((m) => m.orders > 0 || m.revenue > 0);
  const bestMonth = activeMonths.length > 0
    ? activeMonths.reduce((best, m) => (m.revenue > best.revenue ? m : best), activeMonths[0])
    : null;
  const worstMonth = activeMonths.length > 0
    ? activeMonths.reduce((worst, m) => (m.revenue < worst.revenue ? m : worst), activeMonths[0])
    : null;

  const last3Revenue = months.slice(-3).reduce((sum, m) => sum + m.revenue, 0);
  const prev3Revenue = months.slice(-6, -3).reduce((sum, m) => sum + m.revenue, 0);
  const trendPct = prev3Revenue > 0
    ? Math.round(((last3Revenue - prev3Revenue) / prev3Revenue) * 100)
    : 0;
  const topStatus = statusBreakdown.length > 0 ? statusBreakdown[0] : null;

  const hasChartData = months.some((m) => m.revenue > 0 || m.orders > 0);
  const revenueChartData = {
    labels: months.map((m) => m.monthName),
    datasets: [{ data: months.map((m) => Number(m.revenue) || 0) }],
  };
  const ordersBarData = {
    labels: months.map((m) => m.monthName),
    datasets: [{ data: months.map((m) => Number(m.orders) || 0) }],
  };
  const overviewRevenueBarData = {
    labels: months.map((m) => m.monthName),
    datasets: [{ data: months.map((m) => Number(m.revenue) || 0) }],
  };

  const orderPieData = statusBreakdown
    .filter((s) => Number(s.count) > 0)
    .map((s, i) => ({
      name: s._id,
      population: Number(s.count) || 0,
      color: STATUS_COLORS_MAP[s._id] || PIE_COLORS[i % PIE_COLORS.length],
      legendFontColor: COLORS.text,
      legendFontSize: 12,
    }));

  const productPieSource = categoryStats.length > 0
    ? categoryStats.map((c) => ({ label: c._id || 'Unknown', value: Number(c.totalRevenue) || 0 }))
    : topProducts.map((p) => ({ label: p.name || 'Product', value: Number(p.totalRevenue) || 0 }));
  const productPieData = productPieSource
    .filter((p) => p.value > 0)
    .map((p, i) => ({
      name: p.label,
      population: p.value,
      color: PIE_COLORS[i % PIE_COLORS.length],
      legendFontColor: COLORS.text,
      legendFontSize: 12,
    }));

  if (loading && !summary) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="SALES DASHBOARD" onBack={() => navigation.goBack()} />
        <View style={styles.loadingBox}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="SALES DASHBOARD" onBack={() => navigation.goBack()} />

      {/* Year Selector */}
      <View style={styles.yearSelector}>
        <TouchableOpacity style={styles.yearBtn} onPress={() => handleYearChange(-1)}>
          <Text style={styles.yearBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.yearLabel}>{year}</Text>
        <TouchableOpacity
          style={[styles.yearBtn, year >= new Date().getFullYear() && styles.yearBtnDisabled]}
          onPress={() => year < new Date().getFullYear() && handleYearChange(1)}
        >
          <Text style={styles.yearBtnText}>›</Text>
        </TouchableOpacity>
        {loading && <ActivityIndicator color={COLORS.primary} size="small" style={{ marginLeft: SPACING.sm }} />}
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerTitle}>Analytics Error</Text>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

      

        {/* ══════════════════════════════════════════════════════ */}
        {/*  OVERVIEW TAB                                          */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && summary && (
          <>
            {/* KPI Cards */}
            <View style={styles.kpiGrid}>
              <KpiCard
                icon="💰" label="Total Revenue"
                value={fmt(summary.totalRevenue)}
                sub={`${year}`} color={COLORS.primary}
              />
              <KpiCard
                icon="📦" label="Total Orders"
                value={summary.totalOrders}
                sub="all time" color="#5B8DE0"
              />
              <KpiCard
                icon="✅" label="Delivered"
                value={summary.deliveredOrders}
                sub={`${summary.totalOrders > 0 ? Math.round((summary.deliveredOrders / summary.totalOrders) * 100) : 0}% rate`}
                color={COLORS.success}
              />
              <KpiCard
                icon="📊" label="Avg Order"
                value={fmt(summary.avgOrderValue || 0)}
                sub="per order" color="#E07A30"
              />
            </View>

            {/* Mini Bar Chart — Monthly Revenue */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Monthly Revenue — {year}</Text>
              {overviewRevenueBarData.datasets[0].data.some((v) => v > 0) ? (
                <BarChart
                  data={overviewRevenueBarData}
                  width={CHART_W}
                  height={220}
                  fromZero
                  yAxisLabel="₱"
                  withInnerLines
                  chartConfig={CHART_CONFIG}
                  style={styles.chartWidget}
                  showValuesOnTopOfBars
                />
              ) : (
                <Text style={styles.chartSubtitle}>No revenue recorded yet for {year}.</Text>
              )}
            </View>

            {/* Order Status Breakdown */}
            {statusBreakdown.length > 0 && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Order Status Breakdown</Text>
                <View style={styles.statusBreakdownRow}>
                  {statusBreakdown.map((s, i) => {
                    const total = statusBreakdown.reduce((sum, x) => sum + x.count, 0);
                    const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                    return (
                      <View key={s._id} style={styles.statusChip}>
                        <View style={[styles.statusChipDot, { backgroundColor: STATUS_COLORS_MAP[s._id] || '#888' }]} />
                        <View>
                          <Text style={styles.statusChipCount}>{s.count}</Text>
                          <Text style={styles.statusChipLabel}>{s._id}</Text>
                          <Text style={styles.statusChipPct}>{pct}%</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/*  REVENUE TAB                                           */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'revenue' && (
          <>
            {/* Line chart — Revenue trend */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Revenue Trend — {year}</Text>
              <Text style={styles.chartSubtitle}>Monthly revenue in Philippine Peso</Text>
              {hasChartData ? (
                <LineChart
                  data={revenueChartData}
                  width={CHART_W}
                  height={220}
                  yAxisLabel="₱"
                  fromZero
                  withShadow={false}
                  withInnerLines
                  withOuterLines={false}
                  withVerticalLines={false}
                  chartConfig={CHART_CONFIG}
                  style={styles.chartWidget}
                  bezier
                  yLabelsOffset={8}
                  xLabelsOffset={-2}
                />
              ) : (
                <Text style={styles.chartSubtitle}>No revenue data available for this year yet.</Text>
              )}
            </View>

            {/* Bar chart — Orders per month */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Orders per Month — {year}</Text>
              {hasChartData ? (
                <BarChart
                  data={ordersBarData}
                  width={CHART_W}
                  height={210}
                  fromZero
                  withInnerLines
                  withVerticalLabels
                  chartConfig={{
                    ...CHART_CONFIG,
                    color: (opacity = 1) => `rgba(91, 141, 224, ${opacity})`,
                  }}
                  style={styles.chartWidget}
                  showValuesOnTopOfBars
                />
              ) : (
                <Text style={styles.chartSubtitle}>No order data available for this year yet.</Text>
              )}
            </View>

            {/* Monthly revenue table */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Monthly Breakdown Table</Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, styles.tableHead, { flex: 1.5 }]}>Month</Text>
                <Text style={[styles.tableCell, styles.tableHead, { flex: 2, textAlign: 'right' }]}>Revenue</Text>
                <Text style={[styles.tableCell, styles.tableHead, { flex: 1, textAlign: 'right' }]}>Orders</Text>
                <Text style={[styles.tableCell, styles.tableHead, { flex: 2, textAlign: 'right' }]}>Avg Value</Text>
              </View>
              {months.map((m) => (
                <View key={m.month} style={[styles.tableRow, m.revenue === 0 && { opacity: 0.4 }]}>
                  <Text style={[styles.tableCell, { flex: 1.5 }]}>{m.monthName}</Text>
                  <Text style={[styles.tableCell, { flex: 2, textAlign: 'right', color: COLORS.primary, fontWeight: '600' }]}>
                    ₱{m.revenue.toLocaleString()}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{m.orders}</Text>
                  <Text style={[styles.tableCell, { flex: 2, textAlign: 'right', color: COLORS.textSecondary }]}>
                    {m.orders > 0 ? `₱${Math.round(m.revenue / m.orders).toLocaleString()}` : '—'}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/*  PRODUCTS TAB                                          */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'products' && (
          <>
            {/* Top 5 best sellers */}
            {topProducts.length > 0 && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Best-Selling Products</Text>
                <Text style={styles.chartSubtitle}>By units sold (all time)</Text>
                {productPieData.length > 0 && (
                  <PieChart
                    data={productPieData}
                    width={CHART_W}
                    height={220}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="12"
                    hasLegend={false}
                    chartConfig={CHART_CONFIG}
                    center={[10, 0]}
                    absolute
                  />
                )}
                {topProducts.map((p, i) => (
                  <View key={p._id} style={styles.productLegendRow}>
                    <View style={[styles.legendDot, { backgroundColor: PIE_COLORS[i] || COLORS.primary }]} />
                    <Text style={styles.productLegendName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.productLegendQty}>{p.totalQty} sold</Text>
                    <Text style={styles.productLegendRev}>₱{Math.round(p.totalRevenue).toLocaleString()}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Category Revenue Pie / Bar */}
            {categoryStats.length > 0 && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Revenue by Category</Text>
                {categoryStats.map((c, i) => (
                  <View key={c._id} style={styles.categoryRow}>
                    <View style={[styles.legendDot, { backgroundColor: PIE_COLORS[i] || COLORS.primary }]} />
                    <Text style={styles.categoryName}>{c._id || 'Unknown'}</Text>
                    <Text style={styles.categoryOrders}>{c.totalOrders} orders</Text>
                    <Text style={styles.categoryRevenue}>₱{Math.round(c.totalRevenue).toLocaleString()}</Text>
                  </View>
                ))}
              </View>
            )}

            {topProducts.length === 0 && categoryStats.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📊</Text>
                <Text style={styles.emptyTitle}>No Product Data Yet</Text>
                <Text style={styles.emptySubtitle}>Product analytics will appear once orders are placed</Text>
              </View>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/*  ORDERS TAB                                            */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'orders' && (
          <>
            {statusBreakdown.length > 0 && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Orders by Status</Text>
                {orderPieData.length > 0 && (
                  <PieChart
                    data={orderPieData}
                    width={CHART_W}
                    height={220}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="12"
                    hasLegend={false}
                    chartConfig={CHART_CONFIG}
                    center={[10, 0]}
                    absolute
                  />
                )}
                {statusBreakdown.map((s) => {
                  const total = statusBreakdown.reduce((sum, x) => sum + x.count, 0);
                  const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                  return (
                    <View key={s._id} style={styles.statusTableRow}>
                      <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS_MAP[s._id] || '#888' }]} />
                      <Text style={styles.statusTableName}>{s._id}</Text>
                      <View style={styles.statusBar}>
                        <View style={[styles.statusBarFill, { width: `${pct}%`, backgroundColor: STATUS_COLORS_MAP[s._id] || '#888' }]} />
                      </View>
                      <Text style={styles.statusTableCount}>{s.count} ({pct}%)</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {summary && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Performance Summary</Text>
                <SummaryRow label="Total Orders Placed" value={summary.totalOrders} />
                <SummaryRow label="Successfully Delivered" value={summary.deliveredOrders} highlight />
                <SummaryRow label="Cancelled Orders" value={summary.cancelledOrders} negative />
                <SummaryRow label="Delivery Success Rate" value={`${summary.totalOrders > 0 ? Math.round((summary.deliveredOrders / summary.totalOrders) * 100) : 0}%`} highlight />
                <SummaryRow label="Average Order Value" value={`₱${Math.round(summary.avgOrderValue || 0).toLocaleString()}`} />
                <SummaryRow label="Total Revenue Generated" value={`₱${Math.round(summary.totalRevenue || 0).toLocaleString()}`} highlight />
              </View>
            )}

            {statusBreakdown.length === 0 && !summary && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🧾</Text>
                <Text style={styles.emptyTitle}>No Order Data Yet</Text>
                <Text style={styles.emptySubtitle}>Order status analytics will appear once orders are placed</Text>
              </View>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/*  REPORTS TAB                                           */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'reports' && (
          <>
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Executive Report — {year}</Text>
              <Text style={styles.chartSubtitle}>Quick business insights based on current analytics data</Text>

              <View style={styles.reportGrid}>
                <ReportCard
                  title="Total Revenue"
                  value={`₱${Math.round(safeSummary.totalRevenue).toLocaleString()}`}
                  note="Gross sales captured"
                />
                <ReportCard
                  title="Total Orders"
                  value={`${safeSummary.totalOrders}`}
                  note="All statuses included"
                />
                <ReportCard
                  title="Delivery Rate"
                  value={`${deliveryRate}%`}
                  note="Delivered vs total orders"
                  good={deliveryRate >= 70}
                />
                <ReportCard
                  title="Cancel Rate"
                  value={`${cancelRate}%`}
                  note="Cancelled vs total orders"
                  warn={cancelRate > 20}
                />
                <ReportCard
                  title="Avg Order Value"
                  value={`₱${Math.round(safeSummary.avgOrderValue || 0).toLocaleString()}`}
                  note="Mean cart spend"
                />
                <ReportCard
                  title="3-Month Trend"
                  value={`${trendPct >= 0 ? '+' : ''}${trendPct}%`}
                  note="Last 3 months vs previous 3"
                  good={trendPct > 0}
                  warn={trendPct < 0}
                />
              </View>
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Monthly Highlights</Text>
              <SummaryRow
                label="Best Month"
                value={bestMonth ? `${bestMonth.monthName} (₱${Math.round(bestMonth.revenue).toLocaleString()})` : 'No sales yet'}
                highlight={!!bestMonth}
              />
              <SummaryRow
                label="Lowest Month"
                value={worstMonth ? `${worstMonth.monthName} (₱${Math.round(worstMonth.revenue).toLocaleString()})` : 'No sales yet'}
              />
              <SummaryRow
                label="Top Order Status"
                value={topStatus ? `${topStatus._id} (${topStatus.count})` : 'No orders yet'}
              />
              <SummaryRow
                label="Top Product"
                value={topProducts.length > 0 ? `${topProducts[0].name} (${topProducts[0].totalQty} sold)` : 'No product sales yet'}
                highlight={topProducts.length > 0}
              />
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function KpiCard({ icon, label, value, sub, color }) {
  return (
    <View style={[styles.kpiCard, { borderTopColor: color }]}>
      <Text style={styles.kpiIcon}>{icon}</Text>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiSub}>{sub}</Text>
    </View>
  );
}

function SummaryRow({ label, value, highlight, negative }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, highlight && { color: COLORS.primary }, negative && { color: COLORS.error }]}>
        {value}
      </Text>
    </View>
  );
}

function ReportCard({ title, value, note, good, warn }) {
  return (
    <View style={styles.reportCard}>
      <Text style={styles.reportCardTitle}>{title}</Text>
      <Text
        style={[
          styles.reportCardValue,
          good && { color: COLORS.success },
          warn && { color: COLORS.warning },
        ]}
      >
        {value}
      </Text>
      <Text style={styles.reportCardNote}>{note}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  loadingText: { color: COLORS.textSecondary, fontSize: 14 },
  errorBanner: {
    backgroundColor: '#311313',
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  errorBannerTitle: { color: COLORS.error, fontWeight: '700', fontSize: 13, marginBottom: 4 },
  errorBannerText: { color: COLORS.text, fontSize: 12 },

  yearSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.sm, gap: SPACING.lg,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  yearBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  yearBtnDisabled: { opacity: 0.3 },
  yearBtnText: { fontSize: 22, color: COLORS.primary, lineHeight: 26 },
  yearLabel: { fontSize: 20, color: COLORS.text, fontWeight: '700', minWidth: 60, textAlign: 'center' },

  tabBar: {
    flexDirection: 'row', backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  tab: { flex: 1, paddingVertical: 11, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  tabTextActive: { color: COLORS.primary, fontWeight: '700' },

  content: { padding: SPACING.base, gap: SPACING.md },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  kpiCard: {
    flex: 1, minWidth: '45%', backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border, borderTopWidth: 3,
    alignItems: 'center', gap: 2,
  },
  kpiIcon: { fontSize: 22, marginBottom: 2 },
  kpiValue: { fontSize: 22, fontWeight: '700' },
  kpiLabel: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center' },
  kpiSub: { fontSize: 10, color: COLORS.textMuted },

  chartCard: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  chartTitle: { fontSize: 15, color: COLORS.text, fontWeight: '700', marginBottom: 2 },
  chartSubtitle: { fontSize: 11, color: COLORS.textMuted, marginBottom: SPACING.sm },
  chartWidget: { marginTop: SPACING.sm, borderRadius: BORDER_RADIUS.sm },
  simpleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '55',
  },
  simpleLabel: { color: COLORS.textSecondary, fontSize: 12 },
  simpleValue: { color: COLORS.text, fontSize: 13, fontWeight: '600' },

  statusBreakdownRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.surfaceLight, borderRadius: BORDER_RADIUS.sm, padding: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  statusChipDot: { width: 10, height: 10, borderRadius: 5 },
  statusChipCount: { fontSize: 15, color: COLORS.text, fontWeight: '700' },
  statusChipLabel: { fontSize: 10, color: COLORS.textSecondary },
  statusChipPct: { fontSize: 10, color: COLORS.textMuted },

  tableHeader: { flexDirection: 'row', paddingVertical: SPACING.xs, borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 4, marginTop: SPACING.sm },
  tableHead: { fontSize: 11, color: COLORS.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: COLORS.border + '55' },
  tableCell: { fontSize: 13, color: COLORS.text },

  productLegendRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border + '55' },
  legendDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  productLegendName: { flex: 1, fontSize: 13, color: COLORS.text },
  productLegendQty: { fontSize: 12, color: COLORS.textSecondary, marginRight: SPACING.sm },
  productLegendRev: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },

  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border + '55' },
  categoryName: { flex: 1, fontSize: 13, color: COLORS.text },
  categoryOrders: { fontSize: 11, color: COLORS.textSecondary, marginRight: SPACING.sm },
  categoryRevenue: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },

  statusTableRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: COLORS.border + '55' },
  statusTableName: { width: 100, fontSize: 12, color: COLORS.text },
  statusBar: { flex: 1, height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden' },
  statusBarFill: { height: '100%', borderRadius: 4 },
  statusTableCount: { fontSize: 12, color: COLORS.textSecondary, width: 70, textAlign: 'right' },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: COLORS.border + '55' },
  summaryLabel: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  summaryValue: { fontSize: 14, color: COLORS.text, fontWeight: '600' },

  reportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm },
  reportCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    minHeight: 90,
  },
  reportCardTitle: { fontSize: 11, color: COLORS.textMuted, marginBottom: 6 },
  reportCardValue: { fontSize: 17, color: COLORS.primary, fontWeight: '700', marginBottom: 4 },
  reportCardNote: { fontSize: 11, color: COLORS.textSecondary },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 52, marginBottom: SPACING.md },
  emptyTitle: { fontSize: 18, color: COLORS.text, fontWeight: '700', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
});
