import React from "react";

const TermsOfService = () => {
  return (
    <div>
      <h1>利用規約</h1>
      <div className="mt-6 space-y-6 text-gray-700 text-base leading-relaxed">
        <p>
          本利用規約（以下「本規約」）は、Soccer Team
          Management（以下「本サービス」）の利用条件を定めるものです。ユーザーは本サービスを利用することで、本規約に同意したものとみなされます。
        </p>

        <h2 className="text-xl font-bold mt-8 mb-2 text-gray-800">
          1. サービス内容
        </h2>
        <p>
          本サービスは、サッカーチームの試合結果やメンバー情報の管理・分析を支援するWebアプリケーションです。
        </p>

        <h2 className="text-xl font-bold mt-8 mb-2 text-gray-800">
          2. 利用環境・責任
        </h2>
        <p>
          ユーザーは自己の責任で本サービスを利用するものとし、利用に必要な端末・通信環境等はユーザー自身が用意してください。
        </p>

        <h2 className="text-xl font-bold mt-8 mb-2 text-gray-800">
          3. 禁止事項
        </h2>
        <ul className="list-disc pl-6">
          <li>法令または公序良俗に違反する行為</li>
          <li>第三者の権利・利益を侵害する行為</li>
          <li>本サービスの運営を妨害する行為</li>
          <li>虚偽の情報登録・不正アクセス等</li>
        </ul>

        <h2 className="text-xl font-bold mt-8 mb-2 text-gray-800">
          4. 免責事項
        </h2>
        <p>
          本サービスの内容・提供は予告なく変更・中止される場合があります。サービス利用による損害について、運営者は一切の責任を負いません。
        </p>

        <h2 className="text-xl font-bold mt-8 mb-2 text-gray-800">
          5. 個人情報の取扱い
        </h2>
        <p>
          個人情報の取扱いについては、別途定めるプライバシーポリシーに従います。
        </p>

        <h2 className="text-xl font-bold mt-8 mb-2 text-gray-800">
          6. 規約の変更
        </h2>
        <p>
          本規約は必要に応じて変更される場合があります。変更後は本ページにて告知します。
        </p>

        <h2 className="text-xl font-bold mt-8 mb-2 text-gray-800">
          7. お問い合わせ
        </h2>
        <p>
          本サービスに関するご質問・ご相談は、管理者までお問い合わせください。
        </p>
      </div>
    </div>
  );
};

export default TermsOfService;
