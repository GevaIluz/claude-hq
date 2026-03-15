import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Overview } from './pages/Overview';
import { Skills } from './pages/Skills';
import { Plugins } from './pages/Plugins';
import { McpServers } from './pages/McpServers';
import { MemoryPage } from './pages/MemoryPage';
import { Hooks } from './pages/Hooks';
import { Permissions } from './pages/Permissions';
import { Projects } from './pages/Projects';
import { Tasks } from './pages/Tasks';
import { Agents } from './pages/Agents';
import { Planner } from './pages/Planner';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route index element={<Overview />} />
          <Route path="skills" element={<Skills />} />
          <Route path="plugins" element={<Plugins />} />
          <Route path="mcp" element={<McpServers />} />
          <Route path="agents" element={<Agents />} />
          <Route path="memory" element={<MemoryPage />} />
          <Route path="hooks" element={<Hooks />} />
          <Route path="permissions" element={<Permissions />} />
          <Route path="projects" element={<Projects />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="planner" element={<Planner />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
