import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as XLSX from "xlsx";

// Import your supabase client
import { supabase } from "@/src/supabaseClient";

export default function AddScientificName() {
  const [sciName, setSciName] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // States for Editing
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editValue, setEditValue] = useState("");

  const fetchScientificNames = async () => {
    try {
      setFetching(true);
      const { data, error } = await supabase
        .from("Drugs_Scientific_Name")
        .select("id, Scientific_Name")
        .order("id", { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      console.error("Fetch Error:", error.message);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchScientificNames();
  }, []);

  // --- CREATE ---
  const handleAdd = async () => {
    if (!sciName.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("Drugs_Scientific_Name")
        .insert([{ Scientific_Name: sciName.trim() }])
        .select()
        .single();

      if (error) throw error;
      setHistory([data, ...history]);
      setSciName("");
      Keyboard.dismiss();
      Alert.alert("Success", "Scientific Name added.");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- UPDATE ---
  const handleUpdate = async () => {
    if (!editValue.trim() || !editingItem) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("Drugs_Scientific_Name")
        .update({ Scientific_Name: editValue.trim() })
        .eq("id", editingItem.id);

      if (error) throw error;

      setHistory(
        history.map((item) =>
          item.id === editingItem.id
            ? { ...item, Scientific_Name: editValue.trim() }
            : item,
        ),
      );
      setEditModalVisible(false);
      Alert.alert("Updated", "Record updated successfully.");
    } catch (error: any) {
      Alert.alert("Update Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- DELETE ---
  const handleDelete = (id: any) => {
    Alert.alert("Delete Record", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            // FORCE the ID to a number if your DB uses integers
            const numericId = Number(id);

            const { error, count } = await supabase
              .from("Drugs_Scientific_Name")
              .delete()
              .eq("id", numericId); // Use the converted ID here

            if (error) throw error;

            if (count === 0) {
              Alert.alert("Error", "Record not found or already deleted.");
              return;
            }

            // Update the UI
            setHistory((prev) => prev.filter((item) => item.id !== id));

            Alert.alert("Success", "Record deleted.");
          } catch (error: any) {
            Alert.alert("Delete Error", error.message);
          }
        },
      },
    ]);
  };

  // --- EXCEL IMPORT ---
  const handleExcelUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
        ],
      });
      if (result.canceled) return;
      setLoading(true);
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const jsonData: any[] = XLSX.utils.sheet_to_json(
          workbook.Sheets[workbook.SheetNames[0]],
        );
        const { error } = await supabase
          .from("Drugs_Scientific_Name")
          .insert(jsonData);
        if (error) throw error;
        fetchScientificNames();
        Alert.alert("Success", "Excel data imported!");
        setLoading(false);
      };
      reader.readAsArrayBuffer(blob);
    } catch (error: any) {
      Alert.alert("Upload Error", error.message);
      setLoading(false);
    }
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setEditValue(item.Scientific_Name);
    setEditModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* HEADER & FORM */}
      <View style={styles.header}>
        <View style={styles.labIcon}>
          <MaterialCommunityIcons
            name="flask-round-bottom"
            size={28}
            color="#fff"
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Active Ingredients</Text>
          <Text style={styles.subtitle}>Manage drug scientific names</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Generic Name</Text>
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="microscope" size={20} color="#4CAF50" />
          <TextInput
            style={styles.input}
            placeholder="e.g. Ibuprofen"
            value={sciName}
            onChangeText={setSciName}
          />
        </View>
        <TouchableOpacity
          style={[styles.button, !sciName && styles.buttonDisabled]}
          onPress={handleAdd}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save to Database</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.excelButton}
          onPress={handleExcelUpload}
          disabled={loading}
        >
          <MaterialCommunityIcons name="file-excel" size={20} color="#1D6F42" />
          <Text style={styles.excelButtonText}>Import Excel</Text>
        </TouchableOpacity>
      </View>

      {/* LIST */}
      <Text style={styles.listHeading}>Recently Registered</Text>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.Scientific_Name}</Text>
              <Text style={styles.itemSubText}>ID: {item.id}</Text>
            </View>
            <View style={styles.actionGroup}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => openEditModal(item)}
              >
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={18}
                  color="#4CAF50"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { marginLeft: 8 }]}
                onPress={() => handleDelete(item.id)}
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={18}
                  color="#FF5252"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* EDIT MODAL */}
      <Modal visible={isEditModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.label}>Edit Scientific Name</Text>
            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
                <Text style={styles.saveBtnText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F9F4", padding: 24 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  labIcon: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: { marginLeft: 12 },
  title: { fontSize: 20, fontWeight: "800", color: "#2E3A2F" },
  subtitle: { fontSize: 12, color: "#7A8C7C" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
  },
  label: { fontSize: 12, fontWeight: "700", color: "#4CAF50", marginBottom: 8 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FBF9",
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#E0E8E0",
  },
  input: { flex: 1, height: 45, fontSize: 16, color: "#333", marginLeft: 10 },
  button: {
    backgroundColor: "#4CAF50",
    height: 50,
    borderRadius: 12,
    marginTop: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: { backgroundColor: "#C8D6C8" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  excelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: "#1D6F42",
    borderRadius: 12,
  },
  excelButtonText: { color: "#1D6F42", fontWeight: "600", marginLeft: 8 },
  listHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4CAF50",
    marginBottom: 12,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EBF0EB",
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: "700", color: "#333" },
  itemSubText: { fontSize: 12, color: "#888" },
  actionGroup: { flexDirection: "row" },
  actionBtn: { padding: 8, backgroundColor: "#F5F5F5", borderRadius: 8 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: { backgroundColor: "#fff", borderRadius: 20, padding: 20 },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E0E8E0",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginVertical: 15,
  },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  cancelBtn: { padding: 12 },
  cancelBtnText: { color: "#666", fontWeight: "600" },
  saveBtn: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveBtnText: { color: "#fff", fontWeight: "700" },
});
