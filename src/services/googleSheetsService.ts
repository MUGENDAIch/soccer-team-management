// src/services/googleSheetsService.ts - Google Identity Services対応版
export class GoogleSheetsService {
  private isInitialized = false;
  private isAuthenticated = false;
  private accessToken: string | null = null;
  private tokenClient: any = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log("🔄 Initializing Google Sheets API with GIS...");

      // Google API Script を動的に読み込み
      await this.loadGoogleScripts();

      // Google API Client を初期化
      await this.initializeGoogleAPI();

      // Google Identity Services を初期化
      await this.initializeGoogleIdentity();

      this.isInitialized = true;
      console.log("✅ Google Sheets API with GIS initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize Google Sheets API:", error);
      throw error;
    }
  }

  private loadGoogleScripts(): Promise<void> {
    return new Promise((resolve, reject) => {
      let scriptsLoaded = 0;
      const totalScripts = 2;

      const checkComplete = () => {
        scriptsLoaded++;
        if (scriptsLoaded === totalScripts) {
          resolve();
        }
      };

      // Google API Script
      if (typeof window.gapi === "undefined") {
        const gapiScript = document.createElement("script");
        gapiScript.src = "https://apis.google.com/js/api.js";
        gapiScript.async = true;
        gapiScript.onload = () => {
          console.log("📦 Google API script loaded");
          window.gapi.load("client", {
            callback: checkComplete,
            onerror: reject,
          });
        };
        gapiScript.onerror = reject;
        document.head.appendChild(gapiScript);
      } else {
        checkComplete();
      }

      // Google Identity Services Script
      if (typeof window.google === "undefined") {
        const gisScript = document.createElement("script");
        gisScript.src = "https://accounts.google.com/gsi/client";
        gisScript.async = true;
        gisScript.onload = () => {
          console.log("📦 Google Identity Services script loaded");
          checkComplete();
        };
        gisScript.onerror = reject;
        document.head.appendChild(gisScript);
      } else {
        checkComplete();
      }
    });
  }

  private async initializeGoogleAPI(): Promise<void> {
    const apiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;

    console.log("🔧 API Key:", apiKey ? "✅ Set" : "⚠️ Not set (optional)");

    const config: any = {
      discoveryDocs: [
        "https://sheets.googleapis.com/$discovery/rest?version=v4",
      ],
    };

    // APIキーがある場合のみ追加
    if (apiKey) {
      config.apiKey = apiKey;
    }

    try {
      await window.gapi.client.init(config);
      console.log("✅ Google API client initialized");
    } catch (error) {
      console.error("❌ Failed to initialize Google API client:", error);
      throw error;
    }
  }

  private async initializeGoogleIdentity(): Promise<void> {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    console.log(
      "🔧 Initializing GIS with Client ID:",
      clientId ? "✅ Set" : "❌ Missing"
    );

    if (!clientId) {
      throw new Error(
        "VITE_GOOGLE_CLIENT_ID is not set in environment variables"
      );
    }

    try {
      // Google Identity Services のトークンクライアントを初期化
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/spreadsheets",
        callback: (response: any) => {
          if (response.error) {
            console.error("❌ GIS Token error:", response.error);
            throw new Error(`認証エラー: ${response.error}`);
          }
          this.accessToken = response.access_token;
          this.isAuthenticated = true;
          console.log("✅ GIS Token received successfully");
        },
        error_callback: (error: any) => {
          console.error("❌ GIS Error callback:", error);
          this.isAuthenticated = false;
        },
      });

      console.log("✅ Google Identity Services initialized");
    } catch (error) {
      console.error("❌ Failed to initialize Google Identity Services:", error);
      throw error;
    }
  }

  async authenticate(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        console.log("🔄 Initializing before authentication...");
        await this.initialize();
      }

      if (!this.tokenClient) {
        throw new Error("Token client not initialized");
      }

      console.log("🔑 Starting GIS authentication...");

      return new Promise((resolve, reject) => {
        // コールバックを一時的に上書き
        const originalCallback = this.tokenClient.callback;

        this.tokenClient.callback = (response: any) => {
          // 元のコールバックを復元
          this.tokenClient.callback = originalCallback;

          if (response.error) {
            console.error("❌ Authentication failed:", response.error);
            this.isAuthenticated = false;
            reject(new Error(`認証に失敗しました: ${response.error}`));
            return;
          }

          this.accessToken = response.access_token;
          this.isAuthenticated = true;
          console.log("✅ Authentication successful with GIS");
          resolve(true);
        };

        // 認証を開始
        this.tokenClient.requestAccessToken({ prompt: "consent" });
      });
    } catch (error) {
      console.error("❌ Authentication failed:", error);
      this.isAuthenticated = false;

      // ユーザーフレンドリーなエラーメッセージ
      if (error.message?.includes("popup_blocked")) {
        throw new Error(
          "ポップアップがブロックされました。ブラウザの設定を確認してください。"
        );
      } else if (error.message?.includes("access_denied")) {
        throw new Error("Googleアカウントへのアクセスが拒否されました。");
      } else {
        throw new Error(`認証に失敗しました: ${error.message || error}`);
      }
    }
  }

  async readData(range: string): Promise<any[][]> {
    if (!this.isAuthenticated || !this.accessToken) {
      throw new Error("認証されていません。先にサインインしてください。");
    }

    const spreadsheetId = import.meta.env.VITE_SPREADSHEET_ID;
    if (!spreadsheetId) {
      throw new Error("VITE_SPREADSHEET_ID が設定されていません");
    }

    try {
      console.log(`📖 Reading data from range: ${range}`);

      // アクセストークンを設定
      window.gapi.client.setToken({ access_token: this.accessToken });

      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: range,
        valueRenderOption: "UNFORMATTED_VALUE",
        dateTimeRenderOption: "FORMATTED_STRING",
      });

      const values = response.result.values || [];
      console.log(`✅ Successfully read ${values.length} rows from ${range}`);
      return values;
    } catch (error) {
      console.error("❌ Failed to read data:", error);

      if (error.status === 401) {
        this.isAuthenticated = false;
        this.accessToken = null;
        throw new Error("認証が期限切れです。再度サインインしてください。");
      } else if (error.status === 403) {
        throw new Error("スプレッドシートへのアクセス権限がありません。");
      } else if (error.status === 404) {
        throw new Error(
          "指定されたスプレッドシートまたは範囲が見つかりません。"
        );
      } else {
        throw new Error(
          `データの読み込みに失敗しました: ${error.message || error}`
        );
      }
    }
  }

  async writeData(range: string, values: any[][]): Promise<void> {
    if (!this.isAuthenticated || !this.accessToken) {
      throw new Error("認証されていません。先にサインインしてください。");
    }

    const spreadsheetId = import.meta.env.VITE_SPREADSHEET_ID;
    if (!spreadsheetId) {
      throw new Error("VITE_SPREADSHEET_ID が設定されていません");
    }

    try {
      console.log(`📝 Writing ${values.length} rows to range: ${range}`);

      // アクセストークンを設定
      window.gapi.client.setToken({ access_token: this.accessToken });

      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: range,
        valueInputOption: "RAW",
        resource: {
          values: values,
        },
      });

      console.log(`✅ Successfully wrote data to ${range}`);
    } catch (error) {
      console.error("❌ Failed to write data:", error);

      if (error.status === 401) {
        this.isAuthenticated = false;
        this.accessToken = null;
        throw new Error("認証が期限切れです。再度サインインしてください。");
      } else {
        throw new Error(
          `データの書き込みに失敗しました: ${error.message || error}`
        );
      }
    }
  }

  async appendData(range: string, values: any[][]): Promise<void> {
    if (!this.isAuthenticated || !this.accessToken) {
      throw new Error("認証されていません。先にサインインしてください。");
    }

    const spreadsheetId = import.meta.env.VITE_SPREADSHEET_ID;
    if (!spreadsheetId) {
      throw new Error("VITE_SPREADSHEET_ID が設定されていません");
    }

    try {
      console.log(`➕ Appending ${values.length} rows to range: ${range}`);

      // アクセストークンを設定
      window.gapi.client.setToken({ access_token: this.accessToken });

      await window.gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: range,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        resource: {
          values: values,
        },
      });

      console.log(`✅ Successfully appended data to ${range}`);
    } catch (error) {
      console.error("❌ Failed to append data:", error);

      if (error.status === 401) {
        this.isAuthenticated = false;
        this.accessToken = null;
        throw new Error("認証が期限切れです。再度サインインしてください。");
      } else {
        throw new Error(
          `データの追加に失敗しました: ${error.message || error}`
        );
      }
    }
  }

  // 接続状態をチェック
  isConnected(): boolean {
    return this.isInitialized && this.isAuthenticated && !!this.accessToken;
  }

  // サインアウト
  async signOut(): Promise<void> {
    try {
      if (this.accessToken && window.google?.accounts?.oauth2) {
        window.google.accounts.oauth2.revoke(this.accessToken, () => {
          console.log("✅ Token revoked");
        });
      }

      this.isAuthenticated = false;
      this.accessToken = null;
      console.log("✅ Signed out from Google Sheets");
    } catch (error) {
      console.error("❌ Failed to sign out:", error);
    }
  }

  // 認証状態の詳細情報を取得
  getAuthStatus(): {
    initialized: boolean;
    authenticated: boolean;
    hasToken: boolean;
  } {
    return {
      initialized: this.isInitialized,
      authenticated: this.isAuthenticated,
      hasToken: !!this.accessToken,
    };
  }
}

// データマネージャークラス（修正版）
export class SoccerDataManager {
  private googleSheets: GoogleSheetsService;
  private syncInterval: NodeJS.Timeout | null = null;
  private onDataUpdate: (data: any) => void;
  private onError: (error: string) => void;

  constructor(
    onDataUpdate: (data: any) => void,
    onError: (error: string) => void
  ) {
    this.googleSheets = new GoogleSheetsService();
    this.onDataUpdate = onDataUpdate;
    this.onError = onError;
  }

  async initialize(): Promise<boolean> {
    try {
      console.log("🚀 Initializing SoccerDataManager with GIS...");

      // 先に初期化
      await this.googleSheets.initialize();

      // 次に認証
      const authenticated = await this.googleSheets.authenticate();

      if (authenticated) {
        console.log("✅ SoccerDataManager initialized successfully");
        return true;
      } else {
        throw new Error("認証に失敗しました");
      }
    } catch (error) {
      console.error("❌ SoccerDataManager initialization failed:", error);
      this.onError(error.message || "Google Sheets初期化に失敗しました");
      return false;
    }
  }

  // 初回データ同期を安全に実行
  async performInitialSync(): Promise<{
    matches: any[];
    members: any[];
  } | null> {
    try {
      if (!this.googleSheets.isConnected()) {
        throw new Error("Google Sheetsに接続されていません");
      }

      console.log("🔄 Performing initial data sync...");
      const result = await this.syncFromSheets();
      console.log("✅ Initial sync completed");
      return result;
    } catch (error) {
      console.error("❌ Initial sync failed:", error);
      this.onError(`初期同期に失敗しました: ${error.message}`);
      return null;
    }
  }

  // 自動同期を開始
  startAutoSync(intervalMs: number = 30000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      try {
        if (this.googleSheets.isConnected()) {
          await this.syncFromSheets();
          console.log("🔄 Auto sync completed");
        } else {
          console.warn("⚠️ Auto sync skipped - not connected");
        }
      } catch (error) {
        console.error("❌ Auto sync failed:", error);
        // 認証エラーの場合は自動同期を停止
        if (error.message?.includes("認証が期限切れ")) {
          this.stopAutoSync();
          this.onError("認証が期限切れです。再度接続してください。");
        }
      }
    }, intervalMs);

    console.log(`🔄 Auto sync started (every ${intervalMs / 1000} seconds)`);
  }

  // 自動同期を停止
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log("⏹️ Auto sync stopped");
    }
  }

  // スプレッドシートからデータを読み込み
  async syncFromSheets(): Promise<{ matches: any[]; members: any[] }> {
    try {
      const [matchesData, membersData] = await Promise.all([
        this.googleSheets.readData("試合データ!A2:K1000"),
        this.googleSheets.readData("メンバー!A2:G1000"), // G列まで読み込み（権限列を含む）
      ]);

      // 試合データの変換（IDの重複を防ぐ）
      const matches = matchesData
        .filter((row) => row[0]) // IDが存在する行のみ
        .map((row, index) => ({
          id: parseInt(row[0]) || Date.now() + index, // IDが不正な場合はユニークなIDを生成
          date: row[1] || "",
          season: row[2] || "",
          opponent: row[3] || "",
          homeScore: parseInt(row[4]) || 0,
          awayScore: parseInt(row[5]) || 0,
          result: row[6] || "",
          participants: this.parseJSON(row[7], []),
          goals: this.parseJSON(row[8], []),
          assists: this.parseJSON(row[9], []),
          lastUpdated: row[10] || "",
        }));

      // メンバーデータの変換（IDの重複を防ぐ + 権限列を追加）
      const members = membersData
        .filter((row) => row[0]) // IDが存在する行のみ
        .map((row, index) => ({
          id: parseInt(row[0]) || Date.now() + 1000000 + index, // IDが不正な場合はユニークなIDを生成
          name: row[1] || "",
          position: row[2] || "FW",
          joinDate: row[3] || "",
          active: row[4] === true || row[4] === "TRUE" || row[4] === "1",
          permission: row[5] || "member", // 権限列（デフォルトはmember）
          lastUpdated: row[6] || "",
        }));

      // 重複チェック
      const duplicateMatchIds = this.findDuplicateIds(matches);
      const duplicateMemberIds = this.findDuplicateIds(members);

      if (duplicateMatchIds.length > 0) {
        console.warn("⚠️ Duplicate match IDs found:", duplicateMatchIds);
      }
      if (duplicateMemberIds.length > 0) {
        console.warn("⚠️ Duplicate member IDs found:", duplicateMemberIds);
      }

      this.onDataUpdate({ matches, members });
      return { matches, members };
    } catch (error) {
      console.error("❌ Failed to sync from sheets:", error);
      this.onError(`データの読み込みに失敗しました: ${error.message}`);
      throw error;
    }
  }

  // 重複IDを検出するヘルパー関数
  private findDuplicateIds(items: any[]): number[] {
    const ids = items.map((item) => item.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    return [...new Set(duplicates)];
  }

  // スプレッドシートに試合データを同期
  async syncMatches(matches: any[]): Promise<void> {
    try {
      // IDの重複を修正
      const uniqueMatches = this.ensureUniqueIds(matches);

      const values = [
        [
          "ID",
          "日付",
          "大会",
          "対戦相手",
          "自チーム得点",
          "相手得点",
          "結果",
          "参加者",
          "得点者",
          "アシスト",
          "最終更新",
        ],
      ];

      uniqueMatches.forEach((match) => {
        values.push([
          match.id.toString(),
          match.date,
          match.season,
          match.opponent,
          match.homeScore.toString(),
          match.awayScore.toString(),
          match.result,
          JSON.stringify(match.participants),
          JSON.stringify(match.goals),
          JSON.stringify(match.assists),
          new Date().toISOString(),
        ]);
      });

      await this.googleSheets.writeData("試合データ!A1:K1000", values);
      console.log("✅ Matches synced to Google Sheets");
    } catch (error) {
      console.error("❌ Failed to sync matches:", error);
      this.onError(`試合データの同期に失敗しました: ${error.message}`);
      throw error;
    }
  }

  // スプレッドシートにメンバーデータを同期
  async syncMembers(members: any[]): Promise<void> {
    try {
      // IDの重複を修正
      const uniqueMembers = this.ensureUniqueIds(members);

      const values = [
        [
          "ID",
          "名前",
          "ポジション",
          "入団日",
          "アクティブ",
          "権限",
          "最終更新",
        ], // 権限列を追加
      ];

      uniqueMembers.forEach((member) => {
        values.push([
          member.id.toString(),
          member.name,
          member.position,
          member.joinDate,
          member.active ? "TRUE" : "FALSE",
          member.permission || "member", // デフォルトはmember権限
          new Date().toISOString(),
        ]);
      });

      await this.googleSheets.writeData("メンバー!A1:G1000", values); // 範囲をG列まで拡張
      console.log("✅ Members synced to Google Sheets");
    } catch (error) {
      console.error("❌ Failed to sync members:", error);
      this.onError(`メンバーデータの同期に失敗しました: ${error.message}`);
      throw error;
    }
  }

  // IDの重複を修正するヘルパー関数
  private ensureUniqueIds(items: any[]): any[] {
    const seenIds = new Set();
    return items.map((item) => {
      let id = item.id;
      while (seenIds.has(id)) {
        id = Date.now() + Math.floor(Math.random() * 1000);
      }
      seenIds.add(id);
      return { ...item, id };
    });
  }

  // 新しい試合を追加
  async addMatch(match: any): Promise<void> {
    try {
      const values = [
        [
          match.id.toString(),
          match.date,
          match.season,
          match.opponent,
          match.homeScore.toString(),
          match.awayScore.toString(),
          match.result,
          JSON.stringify(match.participants),
          JSON.stringify(match.goals),
          JSON.stringify(match.assists),
          new Date().toISOString(),
        ],
      ];

      await this.googleSheets.appendData("試合データ!A:K", values);
      console.log("✅ Match added to Google Sheets");
    } catch (error) {
      console.error("❌ Failed to add match:", error);
      this.onError(`試合データの追加に失敗しました: ${error.message}`);
      throw error;
    }
  }

  // 新しいメンバーを追加
  async addMember(member: any): Promise<void> {
    try {
      const values = [
        [
          member.id.toString(),
          member.name,
          member.position,
          member.joinDate,
          member.active ? "TRUE" : "FALSE",
          member.permission || "member", // デフォルトはmember権限
          new Date().toISOString(),
        ],
      ];

      await this.googleSheets.appendData("メンバー!A:G", values); // G列まで対応
      console.log("✅ Member added to Google Sheets");
    } catch (error) {
      console.error("❌ Failed to add member:", error);
      this.onError(`メンバーデータの追加に失敗しました: ${error.message}`);
      throw error;
    }
  }

  // 接続状態を取得
  isConnected(): boolean {
    return this.googleSheets.isConnected();
  }

  // 認証状態の詳細情報を取得
  getAuthStatus() {
    return this.googleSheets.getAuthStatus();
  }

  // 切断
  async disconnect(): Promise<void> {
    this.stopAutoSync();
    await this.googleSheets.signOut();
    console.log("🔌 Disconnected from Google Sheets");
  }

  // JSONパース用ヘルパー
  private parseJSON(str: string, defaultValue: any): any {
    try {
      return str ? JSON.parse(str) : defaultValue;
    } catch {
      return defaultValue;
    }
  }
}

// TypeScript用の型定義
declare global {
  interface Window {
    gapi: {
      load: (api: string, callback: any) => void;
      client: {
        init: (config: any) => Promise<void>;
        setToken: (token: { access_token: string }) => void;
        sheets: {
          spreadsheets: {
            values: {
              get: (params: any) => Promise<any>;
              update: (params: any) => Promise<any>;
              append: (params: any) => Promise<any>;
              clear: (params: any) => Promise<any>;
            };
          };
        };
      };
    };
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: any) => any;
          revoke: (token: string, callback: () => void) => void;
        };
      };
    };
  }
}

// シングルトンインスタンス
export const googleSheetsService = new GoogleSheetsService();
