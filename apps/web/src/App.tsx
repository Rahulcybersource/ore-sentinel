import { Routes, Route } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { StyleGuide } from './screens/StyleGuide';
import { Dashboard } from './screens/Dashboard';
import { ReserveMap } from './screens/ReserveMap';
import { Production } from './screens/Production';
import { Alerts } from './screens/Alerts';
import { Recommendations } from './screens/Recommendations';
import { CorporateView } from './screens/CorporateView';
import { NationalOverview } from './screens/NationalOverview';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="map" element={<ReserveMap />} />
        <Route path="production" element={<Production />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="recommendations" element={<Recommendations />} />
        <Route path="corporate" element={<CorporateView />} />
        <Route path="national" element={<NationalOverview />} />
        <Route path="style-guide" element={<StyleGuide />} />
      </Route>
    </Routes>
  );
}
