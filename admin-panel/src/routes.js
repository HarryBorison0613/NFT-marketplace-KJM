import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import Collections from './pages/Collections'
import NFTsToRemove from './pages/NFTsToRemove'
import Header from './components/Header';

const Router = () => {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Collections />}>
        </Route>
        <Route path="/bad-lists" element={<NFTsToRemove />}>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default Router
