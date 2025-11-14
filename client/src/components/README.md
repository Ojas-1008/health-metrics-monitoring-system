# Reusable Components

Organized by feature for better maintainability.

- `auth/` - Login, Register, AuthForm components
- `metrics/` - MetricCard, MetricList, MetricForm
- `charts/` - LineChart, BarChart, PieChart wrappers
- `common/` - Button, Input, Card, Modal, Navbar

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
