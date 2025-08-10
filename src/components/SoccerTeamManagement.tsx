import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trophy,
  Users,
  Calendar,
  Target,
  Award,
  UserPlus,
  UserX,
  Eye,
  EyeOff,
  Download,
  Upload,
  Cloud,
  CloudOff,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";

// Google Sheets Service (前回作成したサービスをインポート)
import {
  googleSheetsService,
  SoccerDataManager,
} from "../services/googleSheetsService";

const SoccerTeamManagement = () => {
  const [currentTab, setCurrentTab] = useState("register");

  // 同期状態の管理
  const [syncStatus, setSyncStatus] = useState({
    isAuthenticated: false,
    isOnline: navigator.onLine,
    lastSyncTime: null as Date | null,
    pendingChanges: 0,
    isSyncing: false,
  });

  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: "success" | "error" | "warning" | "info";
      message: string;
      timestamp: Date;
    }>
  >([]);

  // フィルター状態
  const [filters, setFilters] = useState({
    year: "",
    season: "",
  });

  // 型定義
  type Match = {
    id: number;
    date: string;
    season: string;
    opponent: string;
    homeScore: number;
    awayScore: number;
    result: string;
    participants: string[];
    goals: { player: string; count: number }[];
    assists: { player: string; count: number }[];
  };

  type Member = {
    id: number;
    name: string;
    position: string;
    joinDate: string;
    active: boolean;
  };

  type FormData = {
    date: string;
    season: string;
    opponent: string;
    homeScore: string;
    awayScore: string;
    participants: string[];
    goals: { player: string; count: number }[];
    assists: { player: string; count: number }[];
  };

  // 試合データ（初期値は空配列）
  const [matches, setMatches] = useState<Match[]>([]);

  // 全メンバーリスト（初期値は空配列）
  const [allMembers, setAllMembers] = useState<Member[]>([]);

  // フォームデータ
  const [formData, setFormData] = useState<FormData>({
    date: "",
    season: "春季大会",
    opponent: "",
    homeScore: "",
    awayScore: "",
    participants: [],
    goals: [],
    assists: [],
  });

  const [newParticipant, setNewParticipant] = useState("");
  const [newGoal, setNewGoal] = useState({ player: "", count: 1 });
  const [newAssist, setNewAssist] = useState({ player: "", count: 1 });
  const [newMemberData, setNewMemberData] = useState({
    name: "",
    position: "FW",
    joinDate: "",
  });

  // データマネージャーの初期化
  const [dataManager, setDataManager] = useState<SoccerDataManager | null>(
    null
  );

  // 通知を追加する関数
  const addNotification = useCallback(
    (type: "success" | "error" | "warning" | "info", message: string) => {
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const notification = {
        id: uniqueId,
        type,
        message,
        timestamp: new Date(),
      };
      setNotifications((prev) => [notification, ...prev.slice(0, 4)]); // 最新5件まで保持

      // 5秒後に自動削除
      setTimeout(() => {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notification.id)
        );
      }, 5000);
    },
    []
  );

  // Google Sheets認証
  const handleGoogleAuth = async () => {
    try {
      setSyncStatus((prev) => ({ ...prev, isSyncing: true }));
      addNotification("info", "Google Sheetsに接続しています...");

      const manager = new SoccerDataManager(
        (data) => {
          if (data.matches) setMatches(data.matches);
          if (data.members) setAllMembers(data.members);
          addNotification("success", "データが同期されました");
        },
        (error) => {
          if (typeof error === "string") {
            addNotification("error", error);
          } else if ((error as Error).message !== undefined) {
            addNotification("error", (error as Error).message);
          } else {
            addNotification("error", "不明なエラーが発生しました");
          }
        }
      );

      // 1. まず初期化と認証を実行
      const success = await manager.initialize();

      if (success) {
        setDataManager(manager);

        setSyncStatus((prev) => ({
          ...prev,
          isAuthenticated: true,
          lastSyncTime: new Date(),
        }));

        addNotification("success", "Google Sheetsに接続しました");

        // 2. 認証完了後に初回同期を実行（別処理として）
        setTimeout(async () => {
          try {
            await manager.performInitialSync();
            manager.startAutoSync(30000); // 自動同期開始
          } catch (syncError) {
            console.warn(
              "Initial sync failed, but connection is established:",
              syncError
            );
            addNotification(
              "warning",
              "接続は成功しましたが、初回同期に失敗しました"
            );
          }
        }, 1000);
      } else {
        throw new Error("認証に失敗しました");
      }
    } catch (error) {
      console.error("Google Sheets authentication failed:", error);
      let msg = "Google Sheets接続に失敗";
      if (error instanceof Error) {
        msg += `: ${error.message}`;
      }
      addNotification("error", msg);
    } finally {
      setSyncStatus((prev) => ({ ...prev, isSyncing: false }));
    }
  };

  // 手動同期
  const handleManualSync = async () => {
    if (!syncStatus.isAuthenticated) {
      addNotification("warning", "まずGoogle Sheetsに接続してください");
      return;
    }

    try {
      setSyncStatus((prev) => ({ ...prev, isSyncing: true }));

      await dataManager?.syncFromSheets();

      setSyncStatus((prev) => ({
        ...prev,
        lastSyncTime: new Date(),
      }));

      addNotification("success", "データを同期しました");
    } catch {
      addNotification("error", "同期に失敗しました");
    } finally {
      setSyncStatus((prev) => ({ ...prev, isSyncing: false }));
    }
  };

  // 試合結果の判定
  const getResult = (homeScore: number, awayScore: number) => {
    if (homeScore > awayScore) return "勝利";
    if (homeScore < awayScore) return "敗北";
    return "引き分け";
  };

  // 試合登録（Google Sheets対応）
  const handleSubmit = async () => {
    if (
      !formData.date ||
      !formData.opponent ||
      formData.homeScore === "" ||
      formData.awayScore === ""
    ) {
      addNotification("warning", "必須項目を入力してください");
      return;
    }

    const homeScore = parseInt(formData.homeScore);
    const awayScore = parseInt(formData.awayScore);

    const newMatch = {
      id: Date.now(),
      date: formData.date,
      season: formData.season,
      opponent: formData.opponent,
      homeScore,
      awayScore,
      result: getResult(homeScore, awayScore),
      participants: [...formData.participants],
      goals: [...formData.goals],
      assists: [...formData.assists],
    };

    setMatches([newMatch, ...matches]);

    // Google Sheetsに同期
    if (syncStatus.isAuthenticated) {
      try {
        await dataManager?.addMatch(newMatch);
        addNotification(
          "success",
          "試合結果を登録し、Google Sheetsに同期しました"
        );
      } catch {
        addNotification(
          "warning",
          "試合結果を登録しましたが、同期に失敗しました"
        );
      }
    } else {
      addNotification("success", "試合結果を登録しました（ローカルのみ）");
    }

    // フォームリセット
    setFormData({
      date: "",
      season: "春季大会",
      opponent: "",
      homeScore: "",
      awayScore: "",
      participants: [],
      goals: [],
      assists: [],
    });
  };

  // メンバー追加（Google Sheets対応）
  const addMember = async () => {
    if (!newMemberData.name || !newMemberData.joinDate) {
      addNotification("warning", "名前と入団日を入力してください");
      return;
    }

    if (allMembers.some((member) => member.name === newMemberData.name)) {
      addNotification("error", "同じ名前のメンバーが既に存在します");
      return;
    }

    const newMember = {
      id: Date.now(),
      name: newMemberData.name,
      position: newMemberData.position,
      joinDate: newMemberData.joinDate,
      active: true,
    };

    setAllMembers([...allMembers, newMember]);

    // Google Sheetsに同期
    if (syncStatus.isAuthenticated) {
      try {
        await dataManager?.addMember(newMember);
        addNotification(
          "success",
          "メンバーを追加し、Google Sheetsに同期しました"
        );
      } catch {
        addNotification(
          "warning",
          "メンバーを追加しましたが、同期に失敗しました"
        );
      }
    } else {
      addNotification("success", "メンバーを追加しました（ローカルのみ）");
    }

    setNewMemberData({
      name: "",
      position: "FW",
      joinDate: "",
    });
  };

  // オンライン状態の監視
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus((prev) => ({ ...prev, isOnline: true }));
      addNotification("info", "オンラインに復帰しました");
    };

    const handleOffline = () => {
      setSyncStatus((prev) => ({ ...prev, isOnline: false }));
      addNotification("warning", "オフラインモードです");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [addNotification]);

  // その他の関数
  const addParticipant = () => {
    if (newParticipant && !formData.participants.includes(newParticipant)) {
      setFormData({
        ...formData,
        participants: [...formData.participants, newParticipant],
      });
      setNewParticipant("");
    }
  };

  // deleteMemberのundefinedガード
  const deleteMember = (memberId: number) => {
    const member = allMembers.find((m) => m.id === memberId);
    if (!member) return;
    if (confirm(`${member.name}を削除しますか？`)) {
      setAllMembers(allMembers.filter((m) => m.id !== memberId));
      if (syncStatus.isAuthenticated) {
        addNotification("info", "メンバーを削除しました。同期中...");
      }
    }
  };

  const toggleMemberActive = (memberId: number) => {
    setAllMembers(
      allMembers.map((member) =>
        member.id === memberId ? { ...member, active: !member.active } : member
      )
    );
  };

  const addGoal = () => {
    if (newGoal.player && newGoal.count > 0) {
      const existingGoal = formData.goals.find(
        (g) => g.player === newGoal.player
      );
      if (existingGoal) {
        setFormData({
          ...formData,
          goals: formData.goals.map((g) =>
            g.player === newGoal.player
              ? { ...g, count: g.count + newGoal.count }
              : g
          ),
        });
      } else {
        setFormData({
          ...formData,
          goals: [...formData.goals, { ...newGoal }],
        });
      }
      setNewGoal({ player: "", count: 1 });
    }
  };

  const addAssist = () => {
    if (newAssist.player && newAssist.count > 0) {
      const existingAssist = formData.assists.find(
        (a) => a.player === newAssist.player
      );
      if (existingAssist) {
        setFormData({
          ...formData,
          assists: formData.assists.map((a) =>
            a.player === newAssist.player
              ? { ...a, count: a.count + newAssist.count }
              : a
          ),
        });
      } else {
        setFormData({
          ...formData,
          assists: [...formData.assists, { ...newAssist }],
        });
      }
      setNewAssist({ player: "", count: 1 });
    }
  };

  // メンバー統計計算
  const calculateMemberStats = () => {
    const stats: {
      [name: string]: {
        id: number;
        position: string;
        joinDate: string;
        active: boolean;
        matches: number;
        goals: number;
        assists: number;
        wins: number;
        draws: number;
        losses: number;
      };
    } = {};

    allMembers.forEach((member) => {
      stats[member.name] = {
        id: member.id,
        position: member.position,
        joinDate: member.joinDate,
        active: member.active,
        matches: 0,
        goals: 0,
        assists: 0,
        wins: 0,
        draws: 0,
        losses: 0,
      };
    });

    matches.forEach((match) => {
      match.participants.forEach((participant) => {
        if (stats[participant]) {
          stats[participant].matches++;
          if (match.result === "勝利") stats[participant].wins++;
          else if (match.result === "引き分け") stats[participant].draws++;
          else stats[participant].losses++;
        }
      });

      match.goals.forEach((goal) => {
        if (stats[goal.player]) {
          stats[goal.player].goals += goal.count;
        }
      });

      match.assists.forEach((assist) => {
        if (stats[assist.player]) {
          stats[assist.player].assists += assist.count;
        }
      });
    });

    return stats;
  };

  const memberStats = calculateMemberStats();

  // 試合データのフィルタリング
  const filteredMatches = matches.filter((match) => {
    const matchYear = new Date(match.date).getFullYear().toString();

    if (filters.year && matchYear !== filters.year) return false;
    if (filters.season && match.season !== filters.season) return false;

    return true;
  });

  // 利用可能な年度を取得
  const availableYears = [
    ...new Set(
      matches.map((match) => new Date(match.date).getFullYear().toString())
    ),
  ].sort((a, b) => b.localeCompare(a));

  // フィルター後の統計情報
  const getFilteredStats = () => {
    const wins = filteredMatches.filter((m) => m.result === "勝利").length;
    const draws = filteredMatches.filter((m) => m.result === "引き分け").length;
    const losses = filteredMatches.filter((m) => m.result === "敗北").length;
    const totalGoals = filteredMatches.reduce((sum, m) => sum + m.homeScore, 0);
    const totalConceded = filteredMatches.reduce(
      (sum, m) => sum + m.awayScore,
      0
    );

    return { wins, draws, losses, totalGoals, totalConceded };
  };

  // バージョン情報（必要に応じて値を変更）
  const VERSION = "v1.3.0";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-blue-50">
      {/* バージョン情報 */}
      <div className="w-full flex justify-center pt-2 pb-1">
        <span className="inline-block bg-gray-800 text-white text-xs sm:text-sm font-semibold rounded-full px-3 py-1 shadow-md opacity-80 select-none">
          Soccer Team Management {VERSION}
        </span>
      </div>
      <div className="max-w-7xl mx-auto p-2 sm:p-4 md:p-6">
        {/* 通知エリア */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`px-4 py-3 rounded-lg shadow-lg border-l-4 bg-white animate-fade-in ${
                notification.type === "success"
                  ? "border-green-500"
                  : notification.type === "error"
                    ? "border-red-500"
                    : notification.type === "warning"
                      ? "border-yellow-500"
                      : "border-blue-500"
              }`}
            >
              <div className="flex items-center gap-2">
                {notification.type === "success" && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {notification.type === "error" && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                {notification.type === "warning" && (
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                )}
                {notification.type === "info" && (
                  <AlertCircle className="w-4 h-4 text-blue-500" />
                )}
                <span className="text-sm font-medium text-gray-800">
                  {notification.message}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-strong overflow-hidden border border-gray-100">
          {/* ヘッダー - Google Sheets連携ステータス付き */}
          <div className="bg-gradient-to-r from-green-600 via-green-700 to-emerald-800 text-white p-4 sm:p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/10 to-transparent rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-400/20 to-transparent rounded-full translate-y-24 -translate-x-24"></div>

            <div className="relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-0 mb-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold flex items-center gap-2 sm:gap-4 mb-2">
                    <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                      <Trophy className="w-10 h-10" />
                    </div>
                    ルチャリブレ成績管理システム
                  </h1>
                  <p className="text-green-100 text-lg">
                    リアルタイム共有対応 ⚽
                  </p>
                </div>

                {/* 同期ステータス */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 sm:p-4 min-w-[220px] sm:min-w-[300px]">
                  <div className="flex items-center gap-2 mb-3">
                    <Cloud className="w-5 h-5" />
                    <span className="font-semibold">同期ステータス</span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>接続状態:</span>
                      <div className="flex items-center gap-1">
                        {syncStatus.isOnline ? (
                          <Wifi className="w-4 h-4 text-green-200" />
                        ) : (
                          <WifiOff className="w-4 h-4 text-red-200" />
                        )}
                        <span
                          className={
                            syncStatus.isOnline
                              ? "text-green-200"
                              : "text-red-200"
                          }
                        >
                          {syncStatus.isOnline ? "オンライン" : "オフライン"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Google Sheets:</span>
                      <div className="flex items-center gap-1">
                        {syncStatus.isAuthenticated ? (
                          <CheckCircle className="w-4 h-4 text-green-200" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-200" />
                        )}
                        <span
                          className={
                            syncStatus.isAuthenticated
                              ? "text-green-200"
                              : "text-yellow-200"
                          }
                        >
                          {syncStatus.isAuthenticated ? "接続済み" : "未接続"}
                        </span>
                      </div>
                    </div>

                    {syncStatus.lastSyncTime && (
                      <div className="flex items-center justify-between">
                        <span>最終同期:</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {syncStatus.lastSyncTime.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-3">
                    {!syncStatus.isAuthenticated ? (
                      <button
                        onClick={handleGoogleAuth}
                        disabled={syncStatus.isSyncing}
                        className="flex-1 bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                      >
                        {syncStatus.isSyncing ? (
                          <RefreshCw className="w-4 h-4 animate-spin mx-auto" />
                        ) : (
                          "🔗 接続"
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={handleManualSync}
                        disabled={syncStatus.isSyncing}
                        className="flex-1 bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                      >
                        {syncStatus.isSyncing ? (
                          <RefreshCw className="w-4 h-4 animate-spin mx-auto" />
                        ) : (
                          "🔄 同期"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-4">
                <div className="px-2 py-1 sm:px-4 sm:py-2 bg-white/10 rounded-full text-xs sm:text-sm backdrop-blur-sm">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  {matches.length} 試合記録
                </div>
                <div className="px-2 py-1 sm:px-4 sm:py-2 bg-white/10 rounded-full text-xs sm:text-sm backdrop-blur-sm">
                  <Users className="w-4 h-4 inline mr-2" />
                  {allMembers.filter((m) => m.active).length} アクティブメンバー
                </div>
                {syncStatus.isAuthenticated && (
                  <div className="px-2 py-1 sm:px-4 sm:py-2 bg-white/10 rounded-full text-xs sm:text-sm backdrop-blur-sm">
                    <Cloud className="w-4 h-4 inline mr-2" />
                    リアルタイム同期
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* タブナビゲーション */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 shadow-soft">
            <div className="flex overflow-x-auto no-scrollbar">
              <button
                onClick={() => setCurrentTab("register")}
                className={`px-4 sm:px-8 py-2 sm:py-4 flex items-center gap-2 sm:gap-3 transition-all duration-300 whitespace-nowrap font-medium ${
                  currentTab === "register"
                    ? "bg-white text-green-600 border-b-3 border-green-600 shadow-medium"
                    : "text-gray-600 hover:text-green-600 hover:bg-white/50"
                }`}
              >
                <Plus className="w-5 h-5" />
                試合結果登録
              </button>
              <button
                onClick={() => setCurrentTab("matches")}
                className={`px-4 sm:px-8 py-2 sm:py-4 flex items-center gap-2 sm:gap-3 transition-all duration-300 whitespace-nowrap font-medium ${
                  currentTab === "matches"
                    ? "bg-white text-green-600 border-b-3 border-green-600 shadow-medium"
                    : "text-gray-600 hover:text-green-600 hover:bg-white/50"
                }`}
              >
                <Calendar className="w-5 h-5" />
                試合結果一覧
              </button>
              <button
                onClick={() => setCurrentTab("members")}
                className={`px-4 sm:px-8 py-2 sm:py-4 flex items-center gap-2 sm:gap-3 transition-all duration-300 whitespace-nowrap font-medium ${
                  currentTab === "members"
                    ? "bg-white text-green-600 border-b-3 border-green-600 shadow-medium"
                    : "text-gray-600 hover:text-green-600 hover:bg-white/50"
                }`}
              >
                <UserPlus className="w-5 h-5" />
                メンバー管理
              </button>
              <button
                onClick={() => setCurrentTab("stats")}
                className={`px-4 sm:px-8 py-2 sm:py-4 flex items-center gap-2 sm:gap-3 transition-all duration-300 whitespace-nowrap font-medium ${
                  currentTab === "stats"
                    ? "bg-white text-green-600 border-b-3 border-green-600 shadow-medium"
                    : "text-gray-600 hover:text-green-600 hover:bg-white/50"
                }`}
              >
                <Users className="w-5 h-5" />
                メンバー統計
              </button>
            </div>
          </div>

          {/* コンテンツ */}
          <div className="p-2 sm:p-4 md:p-8 bg-gradient-to-b from-white to-gray-50/50">
            {currentTab === "register" && (
              <div className="space-y-8 animate-fade-in">
                <div className="card hover-lift bg-gradient-card">
                  <div className="card-header">
                    <div className="flex justify-between items-center">
                      <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Plus className="w-6 h-6 text-green-600" />
                        </div>
                        試合結果登録
                      </h2>
                      {syncStatus.isAuthenticated && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <Cloud className="w-4 h-4" />
                          <span>自動同期有効</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-2 sm:p-4 md:p-8 space-y-4 sm:space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          試合日 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) =>
                            setFormData({ ...formData, date: e.target.value })
                          }
                          className="input-field shadow-soft"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          大会 <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.season}
                          onChange={(e) =>
                            setFormData({ ...formData, season: e.target.value })
                          }
                          className="select-field shadow-soft"
                        >
                          <option value="春季大会">🌸 春季大会</option>
                          <option value="秋季大会">🍂 秋季大会</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        対戦相手 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.opponent}
                        onChange={(e) =>
                          setFormData({ ...formData, opponent: e.target.value })
                        }
                        className="input-field shadow-soft"
                        placeholder="例：FC取手"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-blue-700">
                          🏠 自チーム得点
                        </label>
                        <input
                          type="number"
                          value={formData.homeScore}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              homeScore: e.target.value,
                            })
                          }
                          className="input-field shadow-soft text-center text-2xl font-bold"
                          min="0"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-red-700">
                          🏃 相手チーム得点
                        </label>
                        <input
                          type="number"
                          value={formData.awayScore}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              awayScore: e.target.value,
                            })
                          }
                          className="input-field shadow-soft text-center text-2xl font-bold"
                          min="0"
                          required
                        />
                      </div>
                    </div>

                    {/* 参加メンバー */}
                    <div className="bg-green-50 p-2 sm:p-4 md:p-6 rounded-xl border border-green-200">
                      <label className="block text-lg font-semibold text-green-800 mb-4">
                        👥 参加メンバー
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
                        <select
                          value={newParticipant}
                          onChange={(e) => setNewParticipant(e.target.value)}
                          className="flex-1 input-field"
                        >
                          <option value="">メンバーを選択</option>
                          {allMembers
                            .filter(
                              (member) =>
                                member.active &&
                                !formData.participants.includes(member.name)
                            )
                            .map((member) => (
                              <option
                                key={`participant-option-${member.id}`}
                                value={member.name}
                              >
                                {member.name} ({member.position})
                              </option>
                            ))}
                        </select>
                        <button
                          type="button"
                          onClick={addParticipant}
                          className="btn-primary shadow-medium"
                        >
                          追加
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {formData.participants.map((participant, index) => (
                          <span
                            key={`participant-${participant}-${index}`}
                            className="badge-green hover-lift cursor-pointer"
                          >
                            {participant}
                            <button
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  participants: formData.participants.filter(
                                    (p) => p !== participant
                                  ),
                                })
                              }
                              className="ml-2 text-green-500 hover:text-green-700 font-bold"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 得点者 */}
                    <div className="bg-blue-50 p-2 sm:p-4 md:p-6 rounded-xl border border-blue-200">
                      <label className="block text-lg font-semibold text-blue-800 mb-4">
                        ⚽ 得点者
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
                        <select
                          value={newGoal.player}
                          onChange={(e) =>
                            setNewGoal({ ...newGoal, player: e.target.value })
                          }
                          className="flex-1 input-field"
                        >
                          <option value="">得点者を選択</option>
                          {formData.participants.map((participant, index) => (
                            <option
                              key={`goal-option-${participant}-${index}`}
                              value={participant}
                            >
                              {participant}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={newGoal.count}
                          onChange={(e) =>
                            setNewGoal({
                              ...newGoal,
                              count: parseInt(e.target.value),
                            })
                          }
                          min="1"
                          className="w-24 input-field text-center font-bold"
                        />
                        <button
                          type="button"
                          onClick={addGoal}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-medium"
                        >
                          追加
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {formData.goals.map((goal, index) => (
                          <span
                            key={`goal-${goal.player}-${index}-${goal.count}`}
                            className="badge-blue hover-lift cursor-pointer"
                          >
                            ⚽ {goal.player} ({goal.count}点)
                            <button
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  goals: formData.goals.filter(
                                    (_, i) => i !== index
                                  ),
                                })
                              }
                              className="ml-2 text-blue-500 hover:text-blue-700 font-bold"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* アシスト */}
                    <div className="bg-purple-50 p-2 sm:p-4 md:p-6 rounded-xl border border-purple-200">
                      <label className="block text-lg font-semibold text-purple-800 mb-4">
                        🎯 アシスト
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
                        <select
                          value={newAssist.player}
                          onChange={(e) =>
                            setNewAssist({
                              ...newAssist,
                              player: e.target.value,
                            })
                          }
                          className="flex-1 input-field"
                        >
                          <option value="">アシスト者を選択</option>
                          {formData.participants.map((participant, index) => (
                            <option
                              key={`assist-option-${participant}-${index}`}
                              value={participant}
                            >
                              {participant}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={newAssist.count}
                          onChange={(e) =>
                            setNewAssist({
                              ...newAssist,
                              count: parseInt(e.target.value),
                            })
                          }
                          min="1"
                          className="w-24 input-field text-center font-bold"
                        />
                        <button
                          type="button"
                          onClick={addAssist}
                          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-medium"
                        >
                          追加
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {formData.assists.map((assist, index) => (
                          <span
                            key={`assist-${assist.player}-${index}-${assist.count}`}
                            className="badge-purple hover-lift cursor-pointer"
                          >
                            🎯 {assist.player} ({assist.count}アシスト)
                            <button
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  assists: formData.assists.filter(
                                    (_, i) => i !== index
                                  ),
                                })
                              }
                              className="ml-2 text-purple-500 hover:text-purple-700 font-bold"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleSubmit}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 sm:py-4 px-4 sm:px-8 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-strong font-bold text-base sm:text-lg animate-fade-in hover:shadow-medium hover:scale-105"
                    >
                      {syncStatus.isAuthenticated
                        ? "🏆 試合結果を登録 & 同期"
                        : "🏆 試合結果を登録"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentTab === "matches" && (
              <div className="space-y-8 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    試合結果一覧
                  </h2>
                  <button className="btn-secondary flex items-center gap-1 sm:gap-2 shadow-medium text-xs sm:text-base px-2 sm:px-4 py-1 sm:py-2">
                    <Download className="w-4 h-4" />
                    CSVエクスポート
                  </button>
                </div>

                {/* フィルター */}
                <div className="card p-2 sm:p-4 md:p-6 bg-gradient-to-r from-gray-50 to-blue-50 border border-blue-200">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-4 flex items-center gap-1 sm:gap-2">
                    🔍 フィルター
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        年度
                      </label>
                      <select
                        value={filters.year}
                        onChange={(e) =>
                          setFilters({ ...filters, year: e.target.value })
                        }
                        className="select-field shadow-soft"
                      >
                        <option value="">🗓️ すべての年度</option>
                        {availableYears.map((year) => (
                          <option key={`year-filter-${year}`} value={year}>
                            {year}年
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        大会
                      </label>
                      <select
                        value={filters.season}
                        onChange={(e) =>
                          setFilters({ ...filters, season: e.target.value })
                        }
                        className="select-field shadow-soft"
                      >
                        <option value="">🏆 すべての大会</option>
                        <option value="春季大会">🌸 春季大会</option>
                        <option value="秋季大会">🍂 秋季大会</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 統計サマリー */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-4">
                  {(() => {
                    const stats = getFilteredStats();
                    return (
                      <>
                        <div className="stat-card-green hover-lift shadow-medium text-xs sm:text-base p-2 sm:p-4">
                          <div className="text-3xl font-bold text-green-700 mb-1">
                            {stats.wins}
                          </div>
                          <div className="text-sm text-green-600 font-medium">
                            🏆 勝利
                          </div>
                        </div>
                        <div className="stat-card-yellow hover-lift shadow-medium text-xs sm:text-base p-2 sm:p-4">
                          <div className="text-3xl font-bold text-yellow-700 mb-1">
                            {stats.draws}
                          </div>
                          <div className="text-sm text-yellow-600 font-medium">
                            🤝 引き分け
                          </div>
                        </div>
                        <div className="stat-card-red hover-lift shadow-medium text-xs sm:text-base p-2 sm:p-4">
                          <div className="text-3xl font-bold text-red-700 mb-1">
                            {stats.losses}
                          </div>
                          <div className="text-sm text-red-600 font-medium">
                            😢 敗北
                          </div>
                        </div>
                        <div className="stat-card-blue hover-lift shadow-medium text-xs sm:text-base p-2 sm:p-4">
                          <div className="text-3xl font-bold text-blue-700 mb-1">
                            {stats.totalGoals}
                          </div>
                          <div className="text-sm text-blue-600 font-medium">
                            ⚽ 得点
                          </div>
                        </div>
                        <div className="stat-card-gray hover-lift shadow-medium text-xs sm:text-base p-2 sm:p-4">
                          <div className="text-3xl font-bold text-gray-700 mb-1">
                            {stats.totalConceded}
                          </div>
                          <div className="text-sm text-gray-600 font-medium">
                            🥅 失点
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* 試合一覧 */}
                <div className="space-y-6">
                  {filteredMatches.map((match, index) => (
                    <div
                      key={`match-${match.id}-${match.date}-${match.opponent}-${index}`}
                      className="card hover-lift p-2 sm:p-4 md:p-8 shadow-medium bg-gradient-card border border-gray-200"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4 sm:mb-6">
                        <div>
                          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">
                            🆚 {match.opponent}
                          </h3>
                          <p className="text-gray-600 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {match.date} - {match.season}
                          </p>
                        </div>
                        <div
                          className={`px-4 py-2 rounded-full text-sm font-bold shadow-soft ${
                            match.result === "勝利"
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : match.result === "引き分け"
                                ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                : "bg-red-100 text-red-700 border border-red-200"
                          }`}
                        >
                          {match.result === "勝利" && "🏆"}
                          {match.result === "引き分け" && "🤝"}
                          {match.result === "敗北" && "😢"}
                          {match.result}
                        </div>
                      </div>

                      <div className="text-center mb-6 bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-xl">
                        <div className="text-3xl sm:text-5xl font-bold text-gray-800 mb-2">
                          <span className="text-blue-600">
                            {match.homeScore}
                          </span>
                          <span className="text-gray-400 mx-4">-</span>
                          <span className="text-red-600">
                            {match.awayScore}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">最終スコア</div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-6">
                        <div className="bg-gray-50 p-2 sm:p-4 rounded-lg">
                          <h4 className="font-bold text-gray-700 mb-1 sm:mb-3 flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                            <Users className="w-4 h-4" />
                            参加メンバー
                          </h4>
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            {match.participants.map((participant, pIndex) => (
                              <span
                                key={`match-${match.id}-participant-${participant}-${pIndex}`}
                                className="badge-gray text-xs hover-lift"
                              >
                                {participant}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="bg-blue-50 p-2 sm:p-4 rounded-lg">
                          <h4 className="font-bold text-blue-700 mb-1 sm:mb-3 flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                            <Target className="w-4 h-4" />
                            得点者
                          </h4>
                          <div className="space-y-2">
                            {match.goals.map((goal, gIndex) => (
                              <div
                                key={`match-${match.id}-goal-${goal.player}-${gIndex}`}
                                className="text-blue-600 font-medium"
                              >
                                ⚽ {goal.player} ({goal.count}点)
                              </div>
                            ))}
                            {match.goals.length === 0 && (
                              <div className="text-gray-500 italic">なし</div>
                            )}
                          </div>
                        </div>

                        <div className="bg-purple-50 p-2 sm:p-4 rounded-lg">
                          <h4 className="font-bold text-purple-700 mb-1 sm:mb-3 flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                            <Award className="w-4 h-4" />
                            アシスト
                          </h4>
                          <div className="space-y-2">
                            {match.assists.map((assist, aIndex) => (
                              <div
                                key={`match-${match.id}-assist-${assist.player}-${aIndex}`}
                                className="text-purple-600 font-medium"
                              >
                                🎯 {assist.player} ({assist.count}アシスト)
                              </div>
                            ))}
                            {match.assists.length === 0 && (
                              <div className="text-gray-500 italic">なし</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredMatches.length === 0 && (
                    <div className="text-center py-8 sm:py-16 card">
                      <div className="text-gray-400 text-4xl sm:text-6xl mb-2 sm:mb-4">
                        📋
                      </div>
                      <p className="text-gray-500 text-base sm:text-lg">
                        条件に合致する試合がありません
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentTab === "members" && (
              <div className="space-y-8 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <UserPlus className="w-6 h-6 text-purple-600" />
                    </div>
                    メンバー管理
                  </h2>
                  <div className="flex flex-wrap gap-1 sm:gap-3">
                    <button className="btn-secondary flex items-center gap-1 sm:gap-2 shadow-medium text-xs sm:text-base px-2 sm:px-4 py-1 sm:py-2">
                      <Upload className="w-4 h-4" />
                      CSVインポート
                    </button>
                    <button className="btn-secondary flex items-center gap-1 sm:gap-2 shadow-medium text-xs sm:text-base px-2 sm:px-4 py-1 sm:py-2">
                      <Download className="w-4 h-4" />
                      CSVエクスポート
                    </button>
                  </div>
                </div>

                {/* 新メンバー追加フォーム */}
                <div className="card p-2 sm:p-4 md:p-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 hover-lift">
                  <h3 className="text-lg sm:text-xl font-bold text-green-800 mb-2 sm:mb-6 flex items-center gap-2 sm:gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <UserPlus className="w-5 h-5 text-green-600" />
                    </div>
                    ✨ 新メンバー追加
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        👤 名前
                      </label>
                      <input
                        type="text"
                        value={newMemberData.name}
                        onChange={(e) =>
                          setNewMemberData({
                            ...newMemberData,
                            name: e.target.value,
                          })
                        }
                        className="input-field shadow-soft"
                        placeholder="例：山田太郎"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        ⚽ ポジション
                      </label>
                      <select
                        value={newMemberData.position}
                        onChange={(e) =>
                          setNewMemberData({
                            ...newMemberData,
                            position: e.target.value,
                          })
                        }
                        className="select-field shadow-soft"
                      >
                        <option value="FW">🔥 FW (フォワード)</option>
                        <option value="MF">⚡ MF (ミッドフィールダー)</option>
                        <option value="DF">🛡️ DF (ディフェンダー)</option>
                        <option value="GK">🥅 GK (ゴールキーパー)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        📅 入団日
                      </label>
                      <input
                        type="date"
                        value={newMemberData.joinDate}
                        onChange={(e) =>
                          setNewMemberData({
                            ...newMemberData,
                            joinDate: e.target.value,
                          })
                        }
                        className="input-field shadow-soft"
                      />
                    </div>
                  </div>

                  <button
                    onClick={addMember}
                    className="mt-4 sm:mt-6 btn-primary shadow-medium hover:shadow-strong text-xs sm:text-base px-2 sm:px-4 py-2 sm:py-3"
                  >
                    ➕ メンバーを追加
                  </button>
                </div>

                {/* メンバー一覧 */}
                <div className="card overflow-x-auto shadow-medium">
                  <div className="card-header bg-gradient-to-r from-purple-50 to-blue-50 min-w-[480px] sm:min-w-0">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                      <Users className="w-5 h-5 text-purple-600" />
                      👥 メンバー一覧 ({allMembers.length}名)
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px] sm:min-w-0">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            👤 名前
                          </th>
                          <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            ⚽ ポジション
                          </th>
                          <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            📅 入団日
                          </th>
                          <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            📊 状態
                          </th>
                          <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            🔧 操作
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {allMembers.map((member, index) => (
                          <tr
                            key={`member-${member.id}-${member.name}-${index}`}
                            className={`hover:bg-gray-50 transition-colors ${
                              member.active ? "" : "bg-gray-50/50"
                            }`}
                          >
                            <td className="px-8 py-6 whitespace-nowrap">
                              <div className="text-sm font-bold text-gray-900">
                                {member.name}
                              </div>
                            </td>
                            <td className="px-8 py-6 whitespace-nowrap">
                              <span
                                className={`px-3 py-1 text-xs font-bold rounded-full shadow-soft ${
                                  member.position === "FW"
                                    ? "bg-red-100 text-red-700 border border-red-200"
                                    : member.position === "MF"
                                      ? "bg-blue-100 text-blue-700 border border-blue-200"
                                      : member.position === "DF"
                                        ? "bg-green-100 text-green-700 border border-green-200"
                                        : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                }`}
                              >
                                {member.position === "FW" && "🔥"}
                                {member.position === "MF" && "⚡"}
                                {member.position === "DF" && "🛡️"}
                                {member.position === "GK" && "🥅"}
                                {member.position}
                              </span>
                            </td>
                            <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {member.joinDate}
                            </td>
                            <td className="px-8 py-6 whitespace-nowrap">
                              <span
                                className={`px-3 py-1 text-xs font-bold rounded-full shadow-soft ${
                                  member.active
                                    ? "bg-green-100 text-green-700 border border-green-200"
                                    : "bg-gray-100 text-gray-700 border border-gray-200"
                                }`}
                              >
                                {member.active
                                  ? "✅ アクティブ"
                                  : "⭕ 非アクティブ"}
                              </span>
                            </td>
                            <td className="px-8 py-6 whitespace-nowrap text-sm font-medium">
                              <div className="flex gap-3">
                                <button
                                  onClick={() => toggleMemberActive(member.id)}
                                  className={`p-2 rounded-lg transition-all duration-200 shadow-soft hover:shadow-medium ${
                                    member.active
                                      ? "text-gray-600 hover:bg-gray-100 border border-gray-200"
                                      : "text-green-600 hover:bg-green-50 border border-green-200"
                                  }`}
                                  title={
                                    member.active
                                      ? "非アクティブにする"
                                      : "アクティブにする"
                                  }
                                >
                                  {member.active ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => deleteMember(member.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 shadow-soft hover:shadow-medium border border-red-200"
                                  title="削除"
                                >
                                  <UserX className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {currentTab === "stats" && (
              <div className="space-y-8 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Trophy className="w-6 h-6 text-yellow-600" />
                    </div>
                    メンバー統計
                  </h2>
                  <button className="btn-secondary flex items-center gap-1 sm:gap-2 shadow-medium text-xs sm:text-base px-2 sm:px-4 py-1 sm:py-2">
                    <Download className="w-4 h-4" />
                    統計レポート
                  </button>
                </div>

                <div className="card overflow-x-auto shadow-medium">
                  <div className="card-header bg-gradient-to-r from-yellow-50 to-orange-50 min-w-[480px] sm:min-w-0">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                      <Award className="w-5 h-5 text-yellow-600" />
                      📊 個人成績一覧
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            👤 名前
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            ⚽ ポジション
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            🏟️ 試合数
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            ⚽ 得点
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            🎯 アシスト
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            🏆 勝利
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            🤝 引分
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            😢 敗北
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            📈 勝率
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(memberStats)
                          .sort(([, a], [, b]) => b.matches - a.matches)
                          .map(([name, stats], index) => (
                            <tr
                              key={`stats-${name}-${stats.id}-${index}-${stats.matches}`}
                              className={`hover:bg-gray-50 transition-colors ${
                                stats.active ? "" : "bg-gray-50/50 opacity-75"
                              }`}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-bold text-gray-900">
                                  {name}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 text-xs font-bold rounded-full shadow-soft ${
                                    stats.position === "FW"
                                      ? "bg-red-100 text-red-700"
                                      : stats.position === "MF"
                                        ? "bg-blue-100 text-blue-700"
                                        : stats.position === "DF"
                                          ? "bg-green-100 text-green-700"
                                          : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  {stats.position}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                                {stats.matches}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className="font-bold text-blue-600 text-lg">
                                  {stats.goals}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className="font-bold text-purple-600 text-lg">
                                  {stats.assists}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className="font-bold text-green-600 text-lg">
                                  {stats.wins}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className="font-bold text-yellow-600 text-lg">
                                  {stats.draws}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className="font-bold text-red-600 text-lg">
                                  {stats.losses}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {stats.matches > 0 ? (
                                  <span className="font-bold text-lg">
                                    {Math.round(
                                      (stats.wins / stats.matches) * 100
                                    )}
                                    %
                                  </span>
                                ) : (
                                  <span className="text-gray-500">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 統計サマリー */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="card p-8 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover-lift shadow-medium">
                    <h3 className="text-xl font-bold text-blue-800 mb-6 flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Target className="w-5 h-5 text-blue-600" />
                      </div>
                      🏆 得点ランキング
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(memberStats)
                        .filter(([, stats]) => stats.goals > 0)
                        .sort(([, a], [, b]) => b.goals - a.goals)
                        .slice(0, 5)
                        .map(([name, stats], index) => (
                          <div
                            key={`goal-ranking-${name}-${stats.goals}-${index}`}
                            className="flex justify-between items-center p-3 bg-white rounded-lg shadow-soft hover-lift"
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-soft ${
                                  index === 0
                                    ? "bg-yellow-100 text-yellow-700 border-2 border-yellow-300"
                                    : index === 1
                                      ? "bg-gray-100 text-gray-700 border-2 border-gray-300"
                                      : index === 2
                                        ? "bg-orange-100 text-orange-700 border-2 border-orange-300"
                                        : "bg-blue-100 text-blue-700 border-2 border-blue-300"
                                }`}
                              >
                                {index === 0 && "🥇"}
                                {index === 1 && "🥈"}
                                {index === 2 && "🥉"}
                                {index > 2 && index + 1}
                              </div>
                              <span className="font-bold text-gray-800">
                                {name}
                              </span>
                            </div>
                            <span className="text-blue-600 font-bold text-xl">
                              ⚽ {stats.goals}点
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="card p-8 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 hover-lift shadow-medium">
                    <h3 className="text-xl font-bold text-purple-800 mb-6 flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Award className="w-5 h-5 text-purple-600" />
                      </div>
                      🎯 アシストランキング
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(memberStats)
                        .filter(([, stats]) => stats.assists > 0)
                        .sort(([, a], [, b]) => b.assists - a.assists)
                        .slice(0, 5)
                        .map(([name, stats], index) => (
                          <div
                            key={`assist-ranking-${name}-${stats.assists}-${index}`}
                            className="flex justify-between items-center p-3 bg-white rounded-lg shadow-soft hover-lift"
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-soft ${
                                  index === 0
                                    ? "bg-yellow-100 text-yellow-700 border-2 border-yellow-300"
                                    : index === 1
                                      ? "bg-gray-100 text-gray-700 border-2 border-gray-300"
                                      : index === 2
                                        ? "bg-orange-100 text-orange-700 border-2 border-orange-300"
                                        : "bg-purple-100 text-purple-700 border-2 border-purple-300"
                                }`}
                              >
                                {index === 0 && "🥇"}
                                {index === 1 && "🥈"}
                                {index === 2 && "🥉"}
                                {index > 2 && index + 1}
                              </div>
                              <span className="font-bold text-gray-800">
                                {name}
                              </span>
                            </div>
                            <span className="text-purple-600 font-bold text-xl">
                              🎯 {stats.assists}アシスト
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* チーム全体統計 */}
                <div className="card p-8 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 hover-lift shadow-medium">
                  <h3 className="text-2xl font-bold text-emerald-800 mb-6 flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Trophy className="w-6 h-6 text-emerald-600" />
                    </div>
                    📊 チーム全体統計
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-white rounded-xl shadow-soft hover-lift">
                      <div className="text-3xl font-bold text-emerald-600 mb-2">
                        {matches.length}
                      </div>
                      <div className="text-sm font-medium text-gray-600">
                        🏟️ 総試合数
                      </div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-xl shadow-soft hover-lift">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {matches.reduce(
                          (sum, match) => sum + match.homeScore,
                          0
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-600">
                        ⚽ 総得点数
                      </div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-xl shadow-soft hover-lift">
                      <div className="text-3xl font-bold text-purple-600 mb-2">
                        {matches.reduce(
                          (sum, match) =>
                            sum +
                            match.assists.reduce(
                              (assistSum, assist) => assistSum + assist.count,
                              0
                            ),
                          0
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-600">
                        🎯 総アシスト数
                      </div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-xl shadow-soft hover-lift">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {matches.length > 0
                          ? Math.round(
                              (matches.filter((m) => m.result === "勝利")
                                .length /
                                matches.length) *
                                100
                            )
                          : 0}
                        %
                      </div>
                      <div className="text-sm font-medium text-gray-600">
                        📈 勝率
                      </div>
                    </div>
                  </div>
                </div>

                {/* パフォーマンス分析 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="card p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 hover-lift shadow-medium">
                    <h3 className="text-lg font-bold text-indigo-800 mb-4 flex items-center gap-2">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Target className="w-4 h-4 text-indigo-600" />
                      </div>
                      🎯 平均パフォーマンス
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-soft">
                        <span className="text-gray-700 font-medium">
                          試合あたり平均得点
                        </span>
                        <span className="text-indigo-600 font-bold text-lg">
                          {matches.length > 0
                            ? (
                                matches.reduce(
                                  (sum, match) => sum + match.homeScore,
                                  0
                                ) / matches.length
                              ).toFixed(1)
                            : 0}
                          点
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-soft">
                        <span className="text-gray-700 font-medium">
                          試合あたり平均失点
                        </span>
                        <span className="text-red-600 font-bold text-lg">
                          {matches.length > 0
                            ? (
                                matches.reduce(
                                  (sum, match) => sum + match.awayScore,
                                  0
                                ) / matches.length
                              ).toFixed(1)
                            : 0}
                          点
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-soft">
                        <span className="text-gray-700 font-medium">
                          平均参加人数
                        </span>
                        <span className="text-green-600 font-bold text-lg">
                          {matches.length > 0
                            ? (
                                matches.reduce(
                                  (sum, match) =>
                                    sum + match.participants.length,
                                  0
                                ) / matches.length
                              ).toFixed(1)
                            : 0}
                          人
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="card p-6 bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200 hover-lift shadow-medium">
                    <h3 className="text-lg font-bold text-rose-800 mb-4 flex items-center gap-2">
                      <div className="p-2 bg-rose-100 rounded-lg">
                        <Calendar className="w-4 h-4 text-rose-600" />
                      </div>
                      📅 最近の動向
                    </h3>
                    <div className="space-y-3">
                      {matches.slice(0, 3).map((match, index) => (
                        <div
                          key={`recent-match-${match.id}-${index}`}
                          className="flex justify-between items-center p-3 bg-white rounded-lg shadow-soft"
                        >
                          <div>
                            <div className="font-medium text-gray-800">
                              {match.opponent}
                            </div>
                            <div className="text-sm text-gray-600">
                              {match.date}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-800">
                              {match.homeScore}-{match.awayScore}
                            </div>
                            <div
                              className={`text-xs font-medium ${
                                match.result === "勝利"
                                  ? "text-green-600"
                                  : match.result === "引き分け"
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              }`}
                            >
                              {match.result}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoccerTeamManagement;
