# Reusable Components

Organized by feature for better maintainability.

- `auth/` - Login, Register, AuthForm components
- `metrics/` - MetricCard, MetricList, MetricForm
- `dashboard/` - GoogleFitStatus, MetricsList components
- `charts/` - LineChart, BarChart, PieChart wrappers
- `common/` - Button, Input, Card, Modal, Navbar, Toast

Keep components small, focused, and reusable.

## MetricCard Component

**Location:** `components/metrics/MetricCard.jsx`

**Purpose:** Display individual health metric in a card layout with real-time update animations.

### Features
- Large metric value display with unit
- Optional trend indicator (up/down with percentage)
- Color coding based on metric type (steps, calories, weight, sleep, distance, heartRate, activeMinutes)
- Responsive design (mobile-first)
- Icon support with emojis
- Accessibility features (ARIA labels, keyboard navigation)
- Hover effects and click handlers
- **Real-time flash animation** on data updates
- **Optimistic update indicator** with pulse animation
- **Source badges** (Manual, Google Fit, Synced)
- Goal progress bars with color-coded completion
- Previous value comparison

### Props
```javascript
{
  title: 'Steps',           // Metric title
  value: 8500,              // Current value
  unit: 'steps',            // Unit of measurement
  icon: '👟',               // Emoji icon
  trend: { direction: 'up', percentage: 12 }, // Optional trend
  color: 'steps',           // Color theme
  goal: 10000,              // Optional goal value
  lastValue: 7800,          // Optional previous value
  onClick: () => {},        // Optional click handler
  className: '',            // Additional CSS classes
  isOptimistic: false,      // Show saving indicator
  justUpdated: false,       // Trigger flash animation
  source: 'googlefit'       // Data source badge
}
```

### Usage Example
```jsx
import MetricCard from '../components/metrics/MetricCard';

<MetricCard
  title="Steps"
  value={8500}
  unit="steps"
  icon="👟"
  color="steps"
  goal={10000}
  trend={{ direction: 'up', percentage: 8 }}
  source="googlefit"
  justUpdated={true}
/>
```

### Real-time Integration
The component automatically detects value changes and triggers a 2-second flash animation. Use the `justUpdated` prop for manual flash triggers from parent components.

## MetricsList Component

**Location:** `components/dashboard/MetricsList.jsx`

**Purpose:** Display historical health metrics grouped by date with real-time update capabilities.

### Features
- Grouped by date display (newest first)
- Shows all metrics for each date with icons and formatted values
- Edit and delete buttons per entry with confirmation modals
- Pagination (configurable items per page)
- Loading skeletons with improved styling
- Enhanced empty state with helpful messaging
- Responsive grid layout (2-4 columns based on screen size)
- Error handling for delete operations
- **Real-time scroll position preservation** when new metrics are prepended
- **Visual indicators** for newly added entries (green border, "New" badge, slide-in animation)
- **Update indicators** for modified entries (blue border, "Updated" badge)
- **Source badges** showing data origin (Manual, Google Fit, Synced)
- **Automatic indicator cleanup** (3s for new, 2s for updated)

### Props
```javascript
{
  metrics: [
    {
      date: '2025-11-14',
      metrics: { steps: 8500, calories: 320, weight: 70.5 },
      source: 'googlefit'
    }
  ],
  isLoading: false,
  onEdit: (metric) => {},      // Callback when editing
  onDelete: (date) => {},      // Callback when deleting
  dateRange: {                 // Optional date range info
    label: 'Last 7 days',
    startDate: '2025-11-07',
    endDate: '2025-11-14'
  },
  itemsPerPage: 5
}
```

### Usage Example
```jsx
import MetricsList from '../components/dashboard/MetricsList';

<MetricsList
  metrics={metricsData}
  isLoading={false}
  onEdit={handleEditMetric}
  onDelete={handleDeleteMetric}
  dateRange={{ label: 'This Week' }}
  itemsPerPage={10}
/>
```

### Real-time Features
- **Scroll Preservation:** When new metrics arrive at the top, the component automatically adjusts scroll position to maintain the user's view
- **New Entry Detection:** Automatically identifies newly added dates and shows green highlighting with slide-in animation
- **Update Detection:** Detects changes to existing metric data and shows blue highlighting
- **Source Tracking:** Displays badges indicating whether data came from manual entry, Google Fit, or sync operations

### Supported Metric Types
- Steps (👟)
- Calories (🔥)
- Distance (📏)
- Active Minutes (⏱️)
- Sleep Hours (😴)
- Weight (⚖️)
- Heart Rate (❤️)
- Oxygen Saturation (🫁)

## GoogleFitStatus Component

**Location:** `components/dashboard/GoogleFitStatus.jsx`

**Purpose:** Display Google Fit connection status, last sync time, and manual sync trigger.

### Features
- Connection status indicator (Connected/Disconnected with visual badges)
- Last sync timestamp with relative time display ("2 hours ago", "Just now", etc.)
- Manual sync trigger button with loading states
- Sync in progress indicator with spinning animation
- Real-time updates via SSE events
- Responsive design (mobile-friendly)
- Conditional rendering (hidden when status not loaded)
- Error handling for missing data

### Props
```javascript
{
  googleFitStatus: {           // Google Fit connection data from API
    connected: true,           // Boolean connection status
    lastSyncAt: "2025-11-14T10:30:00Z"  // ISO timestamp
  },
  lastSyncAt: "2025-11-14T10:30:00Z",   // Last sync timestamp (from SSE)
  onSyncClick: () => {},       // Callback when manual sync triggered
  isSyncing: false             // Boolean indicating sync in progress
}
```

### Usage Example
```jsx
import GoogleFitStatus from '../components/dashboard/GoogleFitStatus';

<GoogleFitStatus
  googleFitStatus={{
    connected: true,
    lastSyncAt: "2025-11-14T10:30:00Z"
  }}
  lastSyncAt="2025-11-14T10:30:00Z"
  onSyncClick={handleManualSync}
  isSyncing={false}
/>
```

### Status Display Logic
- **Connected:** Green checkmark icon, "Connected" badge, shows last sync time
- **Disconnected:** Gray icon, "Disconnected" badge, no sync info shown
- **Syncing:** Spinning loader icon, "Syncing..." text, disabled sync button
- **Never synced:** Shows "Never" for last sync time

### Time Formatting
- **< 1 minute:** "Just now"
- **< 60 minutes:** "X minute(s) ago"
- **< 24 hours:** "X hour(s) ago"
- **< 7 days:** "X day(s) ago"
- **> 7 days:** Formatted date using `dateUtils.formatDateShort()`

### Real-time Updates
- Listens for `sync:update` SSE events to update `lastSyncAt`
- Automatically recalculates relative time every render
- Updates connection status when Google Fit data changes

## Toast Component

**Location:** `components/common/Toast.jsx`

**Purpose:** Display temporary auto-dismissing notifications with progress bar and animations.

### Features
- Auto-dismiss after configurable duration (default 5000ms)
- Multiple variants: success (green), error (red), warning (yellow), info (blue)
- Smooth slide-in/slide-out animations
- Optional progress bar showing remaining time
- Manual close button with hover effects
- Accessibility features (ARIA labels, screen reader support)
- Configurable duration (set to 0 for no auto-dismiss)
- Custom close callback support
- Responsive design (mobile-friendly)
- Icon support with variant-specific emojis

### Props
```javascript
{
  message: 'Operation completed successfully',  // Notification message
  variant: 'success',                           // 'success' | 'error' | 'warning' | 'info'
  duration: 5000,                               // Auto-dismiss delay in ms (0 = never)
  showProgress: true,                           // Show progress bar
  onClose: () => {},                            // Optional close callback
  className: ''                                 // Additional CSS classes
}
```

### Usage Example
```jsx
import Toast from '../components/common/Toast';

// Success notification
<Toast
  message="Google Fit data synced successfully"
  variant="success"
  duration={4000}
  onClose={() => console.log('Toast closed')}
/>

// Error notification with no auto-dismiss
<Toast
  message="Failed to connect to Google Fit"
  variant="error"
  duration={0}
  showProgress={false}
/>

// Warning notification
<Toast
  message="Your session will expire in 5 minutes"
  variant="warning"
/>
```

### Variants
- **success:** Green theme with checkmark icon (✓)
- **error:** Red theme with X icon (✕)
- **warning:** Yellow theme with exclamation icon (⚠️)
- **info:** Blue theme with info icon (ℹ️)

### Animation Details
- **Entry:** Slide down from top with fade-in (300ms)
- **Exit:** Slide up with fade-out (300ms)
- **Progress Bar:** Smooth width reduction animation
- **Hover Effects:** Close button scales on hover

### Accessibility
- ARIA live region for screen readers
- Proper ARIA labels on interactive elements
- Keyboard navigation support (Escape key closes)
- High contrast colors for visibility
