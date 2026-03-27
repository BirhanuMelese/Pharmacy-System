import { supabase } from "@/src/supabaseClient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AddScientificName() {
  const [sciName, setSciName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isPickerVisible, setPickerVisible] = useState(false);

  // Modal States for Editing
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editSciValue, setEditSciValue] = useState("");
  const [editCatValue, setEditCatValue] = useState("");
  const [isEditPickerVisible, setEditPickerVisible] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("Drugs_Categories")
        .select("id, Categories")
        .order("Categories", { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error("Category Fetch Error:", error.message);
    }
  }, []);

  const fetchScientificNames = useCallback(async () => {
    try {
      setFetching(true);
      const { data, error } = await supabase
        .from("Drugs_Scientific_Name")
        .select("id, Scientific_Name, Categories")
        .order("id", { ascending: false });
      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      console.error("History Fetch Error:", error.message);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchScientificNames();
  }, [fetchCategories, fetchScientificNames]);

  // --- CREATE ---
  const handleAdd = async () => {
    if (!sciName.trim() || !selectedCategory) {
      Alert.alert("Missing Info", "Please enter a name and select a category.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("Drugs_Scientific_Name")
        .insert([
          { Scientific_Name: sciName.trim(), Categories: selectedCategory },
        ])
        .select()
        .single();

      if (error) throw error;
      setHistory([data, ...history]);
      setSciName("");
      setSelectedCategory(null);
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
    if (!editSciValue.trim() || !editCatValue.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("Drugs_Scientific_Name")
        .update({
          Scientific_Name: editSciValue.trim(),
          Categories: editCatValue.trim(),
        })
        .eq("id", editingItem.id);

      if (error) throw error;
      setHistory(
        history.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                Scientific_Name: editSciValue,
                Categories: editCatValue,
              }
            : item,
        ),
      );
      setEditModalVisible(false);
      Alert.alert("Updated", "Record modified successfully.");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- DELETE ---
  const handleDelete = (id: number) => {
    Alert.alert(
      "Delete Record",
      "Are you sure you want to remove this mapping?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("Drugs_Scientific_Name")
                .delete()
                .eq("id", id);
              if (error) throw error;
              setHistory(history.filter((item) => item.id !== id));
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labIcon}>
          <MaterialCommunityIcons name="flask-outline" size={28} color="#fff" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Scientific Names</Text>
          <Text style={styles.subtitle}>Classification Management</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Generic Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Paracetamol"
          value={sciName}
          onChangeText={setSciName}
        />

        <Text style={[styles.label, { marginTop: 15 }]}>Select Category</Text>
        <TouchableOpacity
          style={styles.pickerTrigger}
          onPress={() => setPickerVisible(true)}
        >
          <Text style={{ color: selectedCategory ? "#333" : "#999" }}>
            {selectedCategory || "Choose a category..."}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            (!sciName || !selectedCategory) && styles.buttonDisabled,
          ]}
          onPress={handleAdd}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save Mapping</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.listHeading}>Mapped Ingredients</Text>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.Scientific_Name}</Text>
              <View style={styles.catBadge}>
                <Text style={styles.catBadgeText}>{item.Categories}</Text>
              </View>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={() => {
                  setEditingItem(item);
                  setEditSciValue(item.Scientific_Name);
                  setEditCatValue(item.Categories);
                  setEditModalVisible(true);
                }}
                style={styles.iconBtn}
              >
                <MaterialCommunityIcons
                  name="pencil"
                  size={20}
                  color="#4CAF50"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                style={[styles.iconBtn, { marginLeft: 10 }]}
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={20}
                  color="#FF5252"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* --- CATEGORY PICKER MODAL (For New Entry) --- */}
      <Modal visible={isPickerVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContent}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedCategory(cat.Categories);
                    setPickerVisible(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{cat.Categories}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setPickerVisible(false)}
            >
              <Text style={styles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- EDIT MODAL (Update Both Fields) --- */}
      <Modal visible={isEditModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContent}>
            <Text style={styles.modalTitle}>Update Entry</Text>

            <Text style={styles.label}>Scientific Name</Text>
            <TextInput
              style={styles.input}
              value={editSciValue}
              onChangeText={setEditSciValue}
            />

            <Text style={[styles.label, { marginTop: 15 }]}>Category</Text>
            <TouchableOpacity
              style={styles.pickerTrigger}
              onPress={() => setEditPickerVisible(!isEditPickerVisible)}
            >
              <Text style={{ color: "#333" }}>{editCatValue}</Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={20}
                color="#666"
              />
            </TouchableOpacity>

            {isEditPickerVisible && (
              <View style={styles.inlinePicker}>
                <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={styles.pickerItem}
                      onPress={() => {
                        setEditCatValue(cat.Categories);
                        setEditPickerVisible(false);
                      }}
                    >
                      <Text style={styles.pickerItemText}>
                        {cat.Categories}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.cancelLink}
              >
                <Text style={styles.cancelLinkText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUpdate} style={styles.saveBtn}>
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
  container: { flex: 1, backgroundColor: "#F5F7FA", padding: 24 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 40,
  },
  labIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: { marginLeft: 12 },
  title: { fontSize: 22, fontWeight: "800", color: "#2E3A2F" },
  subtitle: { fontSize: 13, color: "#7A8C7C" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
  },
  label: { fontSize: 12, fontWeight: "700", color: "#4CAF50", marginBottom: 6 },
  input: {
    backgroundColor: "#F9FBF9",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E0E8E0",
    fontSize: 16,
  },
  pickerTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FBF9",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E0E8E0",
  },
  button: {
    backgroundColor: "#4CAF50",
    height: 50,
    borderRadius: 12,
    marginTop: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: { backgroundColor: "#C8D6C8" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  listHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2E3A2F",
    marginBottom: 12,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  itemName: { fontSize: 16, fontWeight: "700", color: "#333" },
  catBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  catBadgeText: { fontSize: 11, color: "#2E7D32", fontWeight: "600" },
  actionRow: { flexDirection: "row", alignItems: "center" },
  iconBtn: { padding: 5 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  pickerContent: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 15,
    textAlign: "center",
  },
  pickerItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  pickerItemText: { fontSize: 15, color: "#333" },
  inlinePicker: {
    marginTop: 5,
    backgroundColor: "#F9F9F9",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 25,
  },
  saveBtn: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveBtnText: { color: "#fff", fontWeight: "bold" },
  cancelLink: { marginRight: 20 },
  cancelLinkText: { color: "#666" },
  closeBtn: { marginTop: 15, alignItems: "center" },
  closeBtnText: { color: "#999", fontWeight: "bold" },
});
