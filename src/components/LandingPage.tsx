import React from "react";
import {
  Trophy,
  Users,
  BarChart3,
  Shield,
  Smartphone,
  Cloud,
} from "lucide-react";

interface LandingPageProps {
  onStartApp: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartApp }) => {
  return (
    <div className="min-h-screen">
      {/* ヒーローセクション */}
      <section className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 text-white">
        <div className="container mx-auto px-6 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                <Trophy className="w-16 h-16" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-6">
              ルチャリブレ成績管理システム
            </h1>
            <p className="text-xl mb-8 text-green-100 max-w-2xl mx-auto">
              サッカーチームの試合結果・メンバー管理を効率化。
              <br />
              リアルタイム同期でチーム全体での情報共有を実現。
            </p>
            <button
              onClick={onStartApp}
              className="bg-white text-green-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🚀 アプリを開始する
            </button>
          </div>
        </div>
      </section>

      {/* 機能紹介 */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            主な機能
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Trophy className="w-8 h-8" />}
              title="試合結果管理"
              description="対戦相手、スコア、得点者、アシストを詳細に記録。勝敗統計も自動計算。"
            />
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="メンバー管理"
              description="選手情報、ポジション、参加履歴を一元管理。アクティブ状態も管理可能。"
            />
            <FeatureCard
              icon={<BarChart3 className="w-8 h-8" />}
              title="統計・分析"
              description="個人成績、チーム成績を可視化。得点・アシストランキングも表示。"
            />
            <FeatureCard
              icon={<Cloud className="w-8 h-8" />}
              title="リアルタイム同期"
              description="Google Sheetsと連携してデータを自動同期。チーム全体で情報共有。"
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="セキュアな認証"
              description="Google認証によるセキュアなアクセス管理。権限に応じた機能制御。"
            />
            <FeatureCard
              icon={<Smartphone className="w-8 h-8" />}
              title="レスポンシブ対応"
              description="PC、タブレット、スマートフォンでどこでもアクセス可能。"
            />
          </div>
        </div>
      </section>

      {/* CTA セクション */}
      <section className="py-20 bg-gradient-to-r from-emerald-50 to-green-50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">
            今すぐ始めよう
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            チームの成績管理をデジタル化して、
            <br />
            より効率的なチーム運営を実現しましょう。
          </p>
          <button
            onClick={onStartApp}
            className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-xl"
          >
            ⚽ 無料で始める
          </button>
        </div>
      </section>
    </div>
  );
};

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <div className="p-6 bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-100">
    <div className="text-green-600 mb-4">{icon}</div>
    <h3 className="text-xl font-bold mb-3 text-gray-800">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

export default LandingPage;
