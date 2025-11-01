import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="card max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">
            Health Metrics App
          </h1>
          <p className="text-gray-600">
            Monitoring System
          </p>
        </div>
        
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">10K</div>
            <div className="text-sm text-gray-500">Steps</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">1500</div>
            <div className="text-sm text-gray-500">Calories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">8h</div>
            <div className="text-sm text-gray-500">Sleep</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
