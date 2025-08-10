import React from "react";

const About = () => {
  return (
    <div className="flex justify-center items-center min-h-[60vh] bg-gradient-to-br from-green-50 via-blue-50 to-gray-50">
      <div className="bg-white rounded-2xl shadow-strong border border-gray-100 max-w-xl w-full p-8 sm:p-10">
        <div className="flex items-center gap-3 mb-6">
          <span className="inline-block bg-green-600 text-white rounded-full p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                fill="#22c55e"
              />
              <path
                d="M8 12l2 2 4-4"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            このアプリについて
          </h1>
        </div>
        <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
          <span className="font-semibold text-green-700">
            Soccer Team Management
          </span>
          は、サッカーチームの運営・管理を効率化するためのWebアプリです。
          <br />
          <span className="block mt-2">
            試合結果の登録・一覧表示、メンバー管理、個人・チームの統計表示、Google
            Sheetsとの連携によるデータ同期など、チーム運営に必要な機能を備えています。
          </span>
          <span className="block mt-2">
            直感的な操作で、チームの成長や活動履歴を簡単に記録・分析できます。
          </span>
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
            試合管理
          </span>
          <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
            メンバー管理
          </span>
          <span className="inline-block bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">
            統計表示
          </span>
          <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">
            Google Sheets連携
          </span>
        </div>
      </div>
    </div>
  );
};

export default About;
