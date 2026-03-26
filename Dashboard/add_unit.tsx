import { supabase } from "@/src/supabaseClient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as XLSX from "xlsx";

interface UnitItem {
  id: number;
  name: string;
}

export default function AddDrugsUnit() {
  const [unitInput, setUnitInput] = useState("");
  const [history, setHistory] = useState<UnitItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modal States
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<UnitItem | null>(null);
  const [editText, setEditText] = useState("");

  const commonUnits = ["Tablet", "Capsule", "Mg", "Ml", "Vial", "Pack"];

  const fetchUnits = useCallback(async () => {
    try {
      setFetching(true);
      const { data, error } = await supabase
        .from("Drugs_Unit") // Updated Table Name
        .select("id, Unit") // Updated Column Name
        .order("id", { ascending: false });

      if (error) throw error;
      setHistory(data?.map((item) => ({ id: item.id, name: item.Unit })) || []);
    } catch (error: any) {
      console.error("Fetch Error:", error.message);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  // --- ADD SINGLE ---
  const handleAddUnit = async (name: string) => {
    const unitName = name || unitInput;
    if (!unitName.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("Drugs_Unit") // Updated Table Name
        .insert([{ Unit: unitName.trim() }]) // Updated Column Name
        .select()
        .single();

      if (error) throw error;

      setHistory([{ id: data.id, name: data.Unit }, ...history]);
      setUnitInput("");
      Keyboard.dismiss();
      Alert.alert("Success", "Unit saved.");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- UPDATE ---
  const handleUpdate = async () => {
    if (!editingItem || !editText.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("Drugs_Unit") // Updated Table Name
        .update({ Unit: editText.trim() }) // Updated Column Name
        .eq("id", editingItem.id);

      if (error) throw error;

      setHistory(
        history.map((item) =>
          item.id === editingItem.id
            ? { ...item, name: editText.trim() }
            : item,
        ),
      );
      setEditModalVisible(false);
      Alert.alert("Updated", "Unit renamed successfully.");
    } catch (error: any) {
      Alert.alert("Update Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- DELETE ---
  const confirmDelete = (id: number) => {
    Alert.alert("Delete Unit", "Remove this measurement unit?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("Drugs_Unit") // Updated Table Name
              .delete()
              .eq("id", id);

            if (error) throw error;
            setHistory(history.filter((item) => item.id !== id));
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
      setIsProcessing(true);

      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onload = async (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const jsonData: any[] = XLSX.utils.sheet_to_json(
            workbook.Sheets[workbook.SheetNames[0]],
          );

          const toInsert = jsonData
            .map((row) => {
              // Looks for header "Unit" case-insensitively
              const key = Object.keys(row).find(
                (k) => k.toLowerCase() === "unit",
              );
              return key ? { Unit: String(row[key]).trim() } : null;
            })
            .filter((item) => item !== null && item.Unit !== "");

          if (toInsert.length === 0)
            throw new Error("Ensure Excel header is 'Unit'");

          const { error } = await supabase.from("Drugs_Unit").insert(toInsert);
          if (error) throw error;

          Alert.alert("Success", `Imported ${toInsert.length} units.`);
          fetchUnits();
        } catch (err: any) {
          Alert.alert("Import Failed", err.message);
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsArrayBuffer(blob);
    } catch (error: any) {
      setIsProcessing(false);
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.scaleIcon}>
          <MaterialCommunityIcons name="scale-balance" size={28} color="#fff" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Unit of Measure</Text>
          <Text style={styles.subtitle}>Define how drugs are dispensed</Text>
        </View>
      </View>

      {/* INPUT CARD */}
      <View style={styles.card}>
        <Text style={styles.label}>Measurement Name</Text>
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons
            name="beaker-outline"
            size={20}
            color="#673AB7"
          />
          <TextInput
            style={styles.input}
            placeholder="e.g. Ounces or Milligrams"
            value={unitInput}
            onChangeText={setUnitInput}
          />
        </View>

        <Text style={styles.chipLabel}>Common Suggestions:</Text>
        <div style={styles.chipContainer as any}>
          {commonUnits.map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.chip}
              onPress={() => handleAddUnit(item)}
            >
              <Text style={styles.chipText}>+ {item}</Text>
            </TouchableOpacity>
          ))}
        </div>

        <TouchableOpacity
          style={[styles.button, !unitInput && styles.buttonDisabled]}
          onPress={() => handleAddUnit(unitInput)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save New Unit</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.excelBtn} onPress={handleExcelUpload}>
          <MaterialCommunityIcons name="file-excel" size={18} color="#2E7D32" />
          <Text style={styles.excelBtnText}>Import (Header: Unit)</Text>
        </TouchableOpacity>
      </View>

      {/* LIST SECTION */}
      <Text style={styles.sectionTitle}>Active Units ({history.length})</Text>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={fetching} onRefresh={fetchUnits} />
        }
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <View style={styles.unitAvatar}>
              <Text style={styles.avatarText}>
                {item.name ? item.name.charAt(0) : "?"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.unitNameText}>{item.name}</Text>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={() => {
                  setEditingItem(item);
                  setEditText(item.name);
                  setEditModalVisible(true);
                }}
              >
                <MaterialCommunityIcons
                  name="pencil"
                  size={20}
                  color="#673AB7"
                  style={{ marginRight: 15 }}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmDelete(item.id)}>
                <MaterialCommunityIcons
                  name="trash-can"
                  size={20}
                  color="#FF5252"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* EDIT MODAL */}
      <Modal visible={isEditModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Unit</Text>
            <TextInput
              style={styles.modalInput}
              value={editText}
              onChangeText={setEditText}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
                <Text style={styles.saveTxt}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* GLOBAL LOADER */}
      {isProcessing && (
        <View style={styles.globalLoader}>
          <ActivityIndicator size="large" color="#673AB7" />
          <Text style={{ marginTop: 10, color: "#fff" }}>
            Processing Excel...
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F3FF", padding: 24 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 25 },
  scaleIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#673AB7",
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: { marginLeft: 15 },
  title: { fontSize: 22, fontWeight: "800", color: "#2D214F" },
  subtitle: { fontSize: 13, color: "#6E618E" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    elevation: 3,
  },
  label: { fontSize: 12, fontWeight: "700", color: "#673AB7", marginBottom: 8 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F8FF",
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#E5E1F9",
  },
  input: { flex: 1, height: 50, fontSize: 16, marginLeft: 10 },
  chipLabel: {
    fontSize: 12,
    color: "#888",
    marginTop: 15,
    marginBottom: 10,
    fontWeight: "600",
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  chipText: { color: "#673AB7", fontSize: 13, fontWeight: "600" },
  button: {
    backgroundColor: "#673AB7",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: { backgroundColor: "#C4B5FD" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  excelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    padding: 10,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#2E7D32",
    borderRadius: 10,
  },
  excelBtnText: {
    color: "#2E7D32",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2D214F",
    marginBottom: 12,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#EBE9FE",
  },
  unitAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F3F0FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  avatarText: { color: "#673AB7", fontWeight: "bold", fontSize: 18 },
  unitNameText: { fontSize: 15, fontWeight: "700", color: "#333" },
  actionRow: { flexDirection: "row", alignItems: "center" },

  // Modals & Loaders
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 25,
  },
  modalContent: { backgroundColor: "#fff", borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 15 },
  modalInput: {
    backgroundColor: "#F9F8FF",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E1F9",
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 20,
  },
  cancelTxt: { color: "#888", fontWeight: "600" },
  saveBtn: {
    backgroundColor: "#673AB7",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveTxt: { color: "#fff", fontWeight: "700" },
  globalLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
});
