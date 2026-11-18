import { IonApp, IonRouterOutlet, IonTabs, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { lazy, Suspense } from 'react';
import { Navigate, Route } from 'react-router-dom';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.system.css'; */
import '@ionic/react/css/palettes/dark.class.css';

/* Theme variables */
import './theme/variables.css';
import './theme/global.css';

// Importation des components et pages
import TabsBar from './components/TabsBar';
import { ThemeProvider } from './components/ThemeProvider';
import { LibraryProvider } from './contexts/LibraryContext';
import BookDetails from './pages/BookDetails';
import BookImport from './pages/BookImport';
import Favorites from './pages/Favorites';
import Home from './pages/Home';
import Library from './pages/Library';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Settings from './pages/Settings';
import Welcome from './pages/Welcome';

const BookReader = lazy(() => import('./pages/BookReader'));

setupIonicReact();

const App: React.FC = () => (
  <ThemeProvider>
    <LibraryProvider>
      <IonApp>
        <IonReactRouter>
          <IonRouterOutlet>
            <Route path="/" element={<Navigate to="/welcome" replace />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route
              path="/reader/:bookId"
              element={
                <Suspense fallback={<div className="reader_loading">Ouverture du lecteur…</div>}>
                  <BookReader />
                </Suspense>
              }
            />
            <Route
              path="/tabs/*"
              element={
                <IonTabs>
                  <IonRouterOutlet>
                    <Route path="/tabs/home" element={<Home />} />
                    <Route path="/tabs/library" element={<Library />} />
                    <Route path="/tabs/favorites" element={<Favorites />} />
                    <Route path="/tabs/settings" element={<Settings />} />
                    <Route path="/tabs/book/:bookId" element={<BookDetails />} />
                    <Route path="/tabs/import" element={<BookImport />} />
                  </IonRouterOutlet>
                  <TabsBar />
                </IonTabs>
              }
            />
          </IonRouterOutlet>
        </IonReactRouter>
      </IonApp>
    </LibraryProvider>
  </ThemeProvider>
);

export default App;
