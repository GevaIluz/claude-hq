import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { Console } from '../components/Console';
import { useOrgData } from '../hooks/useOrgData';

export function DashboardLayout() {
  const { data, loading, live } = useOrgData();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <span className="text-sm text-text-secondary">Loading Claude HQ...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-bg-primary">
      <Sidebar data={data} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar live={live} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-bg-primary">
          <div className="max-w-[1400px] mx-auto w-full">
            <Outlet context={data} />
          </div>
        </main>
        <Console data={data} />
      </div>
    </div>
  );
}
