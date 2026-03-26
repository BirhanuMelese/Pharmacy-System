import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Modal,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../src/supabaseClient";

// File Import Libraries
import * as DocumentPicker from "expo-document-picker";
import * as XLSX from "xlsx";

interface DrugCategory {
  id: number;
  name: string;
}

export default function AddDrugsCategories() {
  const [categoryInput, setCategoryInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Global overlay
  const [refreshing, setRefreshing] = useState(false);
  const [list, setList] = useState<DrugCategory[]>([]);

  // Modal States
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<DrugCategory | null>(null);
  const [editText, setEditText] = useState("");

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("Drugs_Categories")
        .select("id, Categories");
      if (error) throw error;
      setList(
        data?.map((item) => ({ id: item.id, name: item.Categories })) || [],
      );
    } catch (error: any) {
      console.error("Fetch error:", error.message);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // --- ADD SINGLE ---
  const handleAdd = async () => {
    if (!categoryInput.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("Drugs_Categories")
        .insert([{ Categories: categoryInput.trim() }])
        .select()
        .single();

      if (error) throw error;
      setList([{ id: data.id, name: data.Categories }, ...list]);
      setCategoryInput("");
      Keyboard.dismiss();
      Alert.alert("Success", "Category added successfully.");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- BULK IMPORT (FIXED) ---
  // --- BULK IMPORT (FIXED FOR WEB & MOBILE) ---
  // --- BULK IMPORT (CLEANED FOR WEB) ---
  const handleExcelUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
        ],
      });

      if (result.canceled) return;

      setIsProcessing(true);
      const asset = result.assets[0];

      // 1. Fetch the file content
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const reader = new FileReader();

      reader.onload = async (e: any) => {
        try {
          // 2. Read as ArrayBuffer (Most stable for Web/Mobile)
          const data = new Uint8Array(e.target.result);

          // Verify XLSX is loaded
          if (!XLSX || !XLSX.read) {
            throw new Error(
              "Excel library not loaded correctly. Check your imports.",
            );
          }

          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // 3. Convert to JSON
          const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

          if (!jsonData || jsonData.length === 0) {
            throw new Error("The Excel file is empty.");
          }

          // 4. Map columns case-insensitively
          const categoriesToInsert = jsonData
            .map((row) => {
              const key = Object.keys(row).find(
                (k) => k.toLowerCase() === "categories",
              );
              return key ? { Categories: String(row[key]).trim() } : null;
            })
            .filter((item) => item !== null && item.Categories !== "");

          if (categoriesToInsert.length === 0) {
            throw new Error("No data found. Header must be 'Categories'.");
          }

          // 5. Insert to Supabase
          const { error } = await supabase
            .from("Drugs_Categories")
            .insert(categoriesToInsert);

          if (error) throw error;

          Alert.alert(
            "Success",
            `Imported ${categoriesToInsert.length} categories.`,
          );
          fetchCategories();
        } catch (innerError: any) {
          Alert.alert("Process Error", innerError.message);
        } finally {
          setIsProcessing(false);
        }
      };

      reader.readAsArrayBuffer(blob);
    } catch (error: any) {
      setIsProcessing(false);
      Alert.alert("Import Failed", error.message);
    }
  };
  // --- UPDATE ---
  const handleUpdate = async () => {
    if (!editingItem || !editText.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("Drugs_Categories")
        .update({ Categories: editText.trim() })
        .eq("id", editingItem.id);

      if (error) throw error;
      setList(
        list.map((item) =>
          item.id === editingItem.id ? { ...item, name: editText } : item,
        ),
      );
      setEditModalVisible(false);
      Alert.alert("Updated", "Category renamed successfully.");
    } catch (error: any) {
      Alert.alert("Update Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- DELETE ---
  const confirmDelete = (id: number) => {
    Alert.alert(
      "Delete Category",
      "Are you sure you want to remove this category? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDelete(id),
        },
      ],
    );
  };

  const handleDelete = async (id: number) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("Drugs_Categories")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setList(list.filter((item) => item.id !== id));
      Alert.alert("Deleted", "Category has been removed.");
    } catch (error: any) {
      Alert.alert(
        "Error",
        "Could not delete. It might be linked to existing drugs.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Global Processing Overlay */}
      <Modal transparent visible={isProcessing} animationType="fade">
        <View style={styles.overlayLoader}>
          <View style={styles.loaderContent}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loaderText}>Processing...</Text>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Inventory</Text>
          <Text style={styles.subtitle}>Categories & Classifications</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{list.length}</Text>
        </View>
      </View>

      <View style={styles.addCard}>
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons
            name="pill"
            size={20}
            color="#007AFF"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="New Category Name"
            placeholderTextColor="#999"
            value={categoryInput}
            onChangeText={setCategoryInput}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.addButton,
            !categoryInput && { backgroundColor: "#DDD" },
          ]}
          onPress={handleAdd}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Add Category</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.bulkButton} onPress={handleExcelUpload}>
        <MaterialCommunityIcons name="file-excel" size={22} color="#217346" />
        <Text style={styles.bulkButtonText}>
          Import Excel (Header: Categories)
        </Text>
      </TouchableOpacity>

      <Text style={styles.sectionHeader}>Category List</Text>

      <FlatList
        data={list}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchCategories}
            tintColor="#007AFF"
          />
        }
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="folder" size={20} color="#007AFF" />
            </View>
            <Text style={styles.itemText}>{item.name}</Text>
            <View style={styles.actionGroup}>
              <TouchableOpacity
                onPress={() => {
                  setEditingItem(item);
                  setEditText(item.name);
                  setEditModalVisible(true);
                }}
                style={styles.actionBtn}
              >
                <MaterialCommunityIcons
                  name="pencil"
                  size={18}
                  color="#007AFF"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => confirmDelete(item.id)}
                style={[styles.actionBtn, styles.deleteBtn]}
              >
                <MaterialCommunityIcons
                  name="trash-can"
                  size={18}
                  color="#FF3B30"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Edit Modal */}
      <Modal visible={isEditModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rename Category</Text>
            <TextInput
              style={styles.modalInput}
              value={editText}
              onChangeText={setEditText}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUpdate} style={styles.saveBtn}>
                <Text style={styles.saveText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F5F8", paddingHorizontal: 20 },
  overlayLoader: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loaderContent: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
  },
  loaderText: { marginTop: 10, fontWeight: "600", color: "#333" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 60,
    marginBottom: 20,
  },
  title: { fontSize: 32, fontWeight: "800", color: "#1A1A1A" },
  subtitle: { fontSize: 14, color: "#7A7A7A" },
  badge: {
    backgroundColor: "#007AFF",
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { color: "#fff", fontWeight: "bold" },
  addCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FB",
    borderRadius: 12,
    paddingHorizontal: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 48, fontSize: 16 },
  addButton: {
    backgroundColor: "#007AFF",
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  bulkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F5E9",
    padding: 14,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#C8E6C9",
    borderStyle: "dashed",
    marginBottom: 20,
  },
  bulkButtonText: { marginLeft: 10, color: "#2E7D32", fontWeight: "700" },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#444",
    marginBottom: 12,
  },
  listContent: { paddingBottom: 40 },
  listItem: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 18,
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EBF5FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemText: { flex: 1, fontSize: 16, fontWeight: "600", color: "#333" },
  actionGroup: { flexDirection: "row" },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F0F7FF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  deleteBtn: { backgroundColor: "#FFF0F0" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 25,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: 50,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", marginBottom: 15 },
  modalInput: {
    backgroundColor: "#F2F5F8",
    padding: 18,
    borderRadius: 15,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  modalActions: { flexDirection: "row", justifyContent: "space-between" },
  cancelBtn: {
    flex: 1,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  saveBtn: {
    flex: 2,
    backgroundColor: "#007AFF",
    height: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelText: { color: "#7A7A7A", fontWeight: "600" },
  saveText: { color: "#fff", fontWeight: "bold" },
});
