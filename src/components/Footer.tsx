import React from "react";

type Page = "home" | "app" | "privacy" | "terms" | "about";

interface FooterProps {
  onPageChange: (page: Page) => void;
}

const Footer: React.FC<FooterProps> = ({ onPageChange }) => {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-lg font-bold mb-2">
              ルチャリブレ成績管理システム
            </h3>
            <p className="text-gray-400">
              サッカーチームの成績管理をデジタル化
            </p>
          </div>
          <div className="flex gap-6">
            <button
              onClick={() => onPageChange("about")}
              className="text-gray-400 hover:text-white transition-colors"
            >
              アプリについて
            </button>
            <button
              onClick={() => onPageChange("privacy")}
              className="text-gray-400 hover:text-white transition-colors"
            >
              プライバシーポリシー
            </button>
            <button
              onClick={() => onPageChange("terms")}
              className="text-gray-400 hover:text-white transition-colors"
            >
              利用規約
            </button>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-6 pt-6 text-center text-gray-400">
          <p>&copy; 2025 ルチャリブレ成績管理システム. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
