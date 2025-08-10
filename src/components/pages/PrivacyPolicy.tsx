import React from "react";

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold mb-8 text-gray-800">
            プライバシーポリシー
          </h1>
          <div className="prose max-w-none">
            <p className="text-sm text-gray-500 mb-6">
              最終更新日: 2025年8月6日
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-800">
              1. はじめに
            </h2>
            <p className="mb-4 text-gray-600 leading-relaxed">
              Soccer Team
              Management（以下「本サービス」）は、サッカーチームの試合結果やメンバー情報を管理するWebアプリケーションです。本サービスでは、ユーザーのプライバシー保護を最重要視し、個人情報の適切な取り扱いに努めます。
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-800">
              2. 取得する情報
            </h2>
            <p className="mb-4 text-gray-600 leading-relaxed">
              本サービスでは、以下の情報を取得する場合があります。
              <ul className="list-disc pl-6 mt-2">
                <li>氏名（ニックネーム含む）</li>
                <li>
                  チームメンバーのポジション・入団日などのプロフィール情報
                </li>
                <li>試合結果・統計データ</li>
                <li>Googleアカウント情報（Google Sheets連携時のみ）</li>
                <li>サービス利用時のアクセスログ・端末情報</li>
              </ul>
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-800">
              3. 利用目的
            </h2>
            <p className="mb-4 text-gray-600 leading-relaxed">
              取得した情報は、以下の目的で利用します。
              <ul className="list-disc pl-6 mt-2">
                <li>チーム運営・成績管理機能の提供</li>
                <li>Google Sheets等外部サービスとの連携・同期</li>
                <li>サービス改善・不具合対応</li>
                <li>利用状況の分析・統計データの表示</li>
              </ul>
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-800">
              4. 第三者提供
            </h2>
            <p className="mb-4 text-gray-600 leading-relaxed">
              取得した個人情報は、法令に基づく場合を除き、第三者に提供することはありません。
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-800">
              5. 外部サービスとの連携
            </h2>
            <p className="mb-4 text-gray-600 leading-relaxed">
              Google
              Sheets等の外部サービスと連携する際は、認証情報やデータ同期のために必要な範囲でのみ情報を取得・利用します。外部サービスのプライバシーポリシーもご確認ください。
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-800">
              6. セキュリティ
            </h2>
            <p className="mb-4 text-gray-600 leading-relaxed">
              本サービスは、取得した情報の漏洩・改ざん・不正アクセス等を防止するため、適切な安全管理措置を講じます。
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-800">
              7. プライバシーポリシーの変更
            </h2>
            <p className="mb-4 text-gray-600 leading-relaxed">
              本ポリシーは、必要に応じて内容を変更する場合があります。変更後は本ページにて速やかに告知します。
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-800">
              8. お問い合わせ
            </h2>
            <p className="mb-4 text-gray-600 leading-relaxed">
              プライバシーポリシーに関するご質問・ご相談は、管理者までお問い合わせください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
