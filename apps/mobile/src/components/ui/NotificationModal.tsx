import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useToastStore, type ToastMessage } from "../../store/toastStore";
import { Colors } from "../../constants/colors";

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
}

type TabType = "ALL" | "FEATURE" | "ERROR";

export function NotificationModal({ visible, onClose }: NotificationModalProps) {
  const { history, clearHistory, markAllRead, showError, showSuccess, showInfo } = useToastStore();
  const [activeTab, setActiveTab] = useState<TabType>("ALL");

  const filtered = history.filter((item) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "FEATURE") return item.type === "success" || item.type === "info";
    if (activeTab === "ERROR") return item.type === "error" || item.type === "warning";
    return true;
  });

  const getIconConfig = (type: ToastMessage["type"]) => {
    switch (type) {
      case "success":
        return { name: "checkmark-circle" as const, color: "#10b981", bg: "rgba(16, 185, 129, 0.15)", label: "Chức năng" };
      case "error":
        return { name: "alert-circle" as const, color: "#ef4444", bg: "rgba(239, 68, 68, 0.18)", label: "Lỗi hệ thống" };
      case "warning":
        return { name: "warning" as const, color: "#f59e0b", bg: "rgba(245, 158, 11, 0.18)", label: "Cảnh báo" };
      case "info":
      default:
        return { name: "information-circle" as const, color: "#22d3ee", bg: "rgba(6, 182, 212, 0.15)", label: "Thông báo" };
    }
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={styles.bellIconWrap}>
                <Ionicons name="notifications" size={20} color={Colors.dark.primary} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Trung Tâm Thông Báo 🔔</Text>
                <Text style={styles.headerSubtitle}>Thông báo lỗi & Cập nhật chức năng</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close-circle" size={26} color={Colors.dark.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Quick Action Test Buttons */}
          <View style={styles.quickBar}>
            <Text style={styles.quickBarLabel}>Kiểm tra nhanh:</Text>
            <TouchableOpacity
              style={[styles.quickTestBtn, { borderColor: "#ef4444" }]}
              onPress={() => showError("Lỗi phát âm thanh", "Mạng chập chờn hoặc không tìm thấy bài hát.")}
            >
              <Ionicons name="alert-circle" size={13} color="#ef4444" />
              <Text style={[styles.quickTestText, { color: "#ef4444" }]}>Thử báo lỗi</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickTestBtn, { borderColor: "#10b981" }]}
              onPress={() => showSuccess("Đã thêm phát sau", "Bài hát đã xếp vào hàng đợi phát sau.")}
            >
              <Ionicons name="checkmark-circle" size={13} color="#10b981" />
              <Text style={[styles.quickTestText, { color: "#10b981" }]}>Thử chức năng</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Tabs */}
          <View style={styles.tabsRow}>
            {[
              { id: "ALL", label: `Tất cả (${history.length})` },
              { id: "FEATURE", label: "Chức năng ⭐" },
              { id: "ERROR", label: "Lỗi & Cảnh báo ⚠️" },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabItem, activeTab === tab.id && styles.tabItemActive]}
                onPress={() => setActiveTab(tab.id as TabType)}
              >
                <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Notifications List */}
          {filtered.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="notifications-off-outline" size={48} color={Colors.dark.textMuted} />
              <Text style={styles.emptyTitle}>Chưa có thông báo nào</Text>
              <Text style={styles.emptySub}>Các cảnh báo lỗi và cập nhật chức năng sẽ hiển thị tại đây.</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingVertical: 10, paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const conf = getIconConfig(item.type);
                return (
                  <View style={[styles.itemCard, !item.read && styles.itemCardUnread]}>
                    <View style={[styles.itemIconWrap, { backgroundColor: conf.bg }]}>
                      <Ionicons name={conf.name} size={20} color={conf.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={[styles.itemCategory, { color: conf.color }]}>{conf.label}</Text>
                        <Text style={styles.itemTime}>{formatTime(item.timestamp)}</Text>
                      </View>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      {!!item.message && <Text style={styles.itemMessage}>{item.message}</Text>}
                    </View>
                  </View>
                );
              }}
            />
          )}

          {/* Footer Controls */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.footerBtn} onPress={markAllRead}>
              <Ionicons name="checkmark-done" size={16} color={Colors.dark.textMuted} />
              <Text style={styles.footerBtnText}>Đã đọc tất cả</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.footerBtn} onPress={clearHistory}>
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
              <Text style={[styles.footerBtnText, { color: "#ef4444" }]}>Xóa lịch sử</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#161626",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    maxHeight: "82%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  bellIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(233, 30, 99, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  quickBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  quickBarLabel: {
    fontSize: 11,
    color: Colors.dark.textMuted,
  },
  quickTestBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.8,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  quickTestText: {
    fontSize: 11,
    fontWeight: "600",
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 10,
    padding: 3,
    marginBottom: 10,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: Colors.dark.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.dark.textMuted,
  },
  tabTextActive: {
    color: "#fff",
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
  },
  itemCardUnread: {
    borderColor: "rgba(233, 30, 99, 0.3)",
    backgroundColor: "rgba(233, 30, 99, 0.04)",
  },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  itemCategory: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  itemTime: {
    fontSize: 10,
    color: Colors.dark.textMuted,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    marginTop: 2,
  },
  itemMessage: {
    fontSize: 11.5,
    color: Colors.dark.textMuted,
    lineHeight: 16,
    marginTop: 2,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  footerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  footerBtnText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    fontWeight: "600",
  },
});
