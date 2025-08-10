import React from "react";
import { Home, Info, FileText, Shield } from "lucide-react";

type Page = "home" | "app" | "privacy" | "terms" | "about";

interface NavigationProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

const Navigation: React.FC<NavigationProps> = ({
  currentPage,
  onPageChange,
}) => {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center py-4">
          <button
            onClick={() => onPageChange("home")}
            className="flex items-center gap-2 text-xl font-bold text-green-700 hover:text-green-800"
          >
            <div className="p-1 bg-green-100 rounded-lg">
              <Home className="w-5 h-5" />
            </div>
            ルチャリブレ成績管理
          </button>

          <div className="hidden md:flex items-center gap-6">
            <NavLink
              page="about"
              currentPage={currentPage}
              onPageChange={onPageChange}
              icon={<Info className="w-4 h-4" />}
            >
              アプリについて
            </NavLink>
            <NavLink
              page="privacy"
              currentPage={currentPage}
              onPageChange={onPageChange}
              icon={<Shield className="w-4 h-4" />}
            >
              プライバシー
            </NavLink>
            <NavLink
              page="terms"
              currentPage={currentPage}
              onPageChange={onPageChange}
              icon={<FileText className="w-4 h-4" />}
            >
              利用規約
            </NavLink>
            {currentPage !== "app" && (
              <button
                onClick={() => onPageChange("app")}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                アプリを開く
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavLink: React.FC<{
  page: Page;
  currentPage: Page;
  onPageChange: (page: Page) => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ page, currentPage, onPageChange, icon, children }) => (
  <button
    onClick={() => onPageChange(page)}
    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
      currentPage === page
        ? "bg-green-100 text-green-700 font-medium"
        : "text-gray-600 hover:text-green-700 hover:bg-green-50"
    }`}
  >
    {icon}
    {children}
  </button>
);

export default Navigation;
