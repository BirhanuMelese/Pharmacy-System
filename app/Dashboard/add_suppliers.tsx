import { supabase } from "@/src/supabaseClient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface SupplierItem {
  id: number;
  Supplier: string;
  Contact: string;
  Address: string;
  License_Url: string;
  Expiry_Date: string;
}

export default function AddSuppliers() {
  const initialState = {
    Supplier: "",
    Contact: "",
    Address: "",
    License_Url: "",
    Expiry_Date: "",
  };

  const [form, setForm] = useState(initialState);
  const [list, setList] = useState<SupplierItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingItem, setEditingItem] = useState<SupplierItem | null>(null);
  const [isEditModalVisible, setEditModalVisible] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    try {
      setFetching(true);
      const { data, error } = await supabase
        .from("Drugs_Supplier")
        .select("*")
        .order("id", { ascending: false });
      if (error) throw error;
      setList(data || []);
    } catch (error: any) {
      console.error("Fetch Error:", error.message);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // --- IMAGE UPLOAD LOGIC (FIXED FOR WEB) ---
  const pickImage = async (isEditing: boolean = false) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0], isEditing);
    }
  };

  const uploadImage = async (asset: any, isEditing: boolean) => {
    try {
      setUploading(true);
      const fileExt = asset.uri.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `licenses/${fileName}`;

      // CRITICAL FIX: Convert URI to Blob for Supabase Storage (Required for Web)
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from("supplier_licenses")
        .upload(filePath, blob, {
          contentType: asset.type || "image/jpeg",
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("supplier_licenses")
        .getPublicUrl(filePath);

      if (isEditing && editingItem) {
        setEditingItem({ ...editingItem, License_Url: data.publicUrl });
      } else {
        setForm((prev) => ({ ...prev, License_Url: data.publicUrl }));
      }

      if (Platform.OS !== "web") Alert.alert("Success", "License Uploaded!");
    } catch (error: any) {
      console.error("Upload Error:", error);
      Alert.alert("Upload Error", error.message);
    } finally {
      setUploading(false);
    }
  };

  // --- SAVE ---
  const handleSave = async () => {
    if (!form.Supplier || !form.Contact) {
      Alert.alert("Error", "Company Name and Contact are required!");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("Drugs_Supplier")
        .insert([form])
        .select()
        .single();
      if (error) throw error;
      setList([data, ...list]);
      setForm(initialState);
      Alert.alert("Success", "Partner Registered! 🤝");
    } catch (error: any) {
      Alert.alert("Save Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- UPDATE ---
  const handleUpdate = async () => {
    if (!editingItem) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("Drugs_Supplier")
        .update(editingItem)
        .eq("id", editingItem.id);
      if (error) throw error;
      setList(
        list.map((item) => (item.id === editingItem.id ? editingItem : item)),
      );
      setEditModalVisible(false);
      Alert.alert("Success", "Updated successfully!");
    } catch (error: any) {
      Alert.alert("Update Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- DELETE ---
  const handleDelete = (id: number) => {
    const performDelete = async () => {
      const { error } = await supabase
        .from("Drugs_Supplier")
        .delete()
        .eq("id", id);
      if (!error) setList(list.filter((i) => i.id !== id));
    };

    if (Platform.OS === "web") {
      if (confirm("Are you sure you want to delete this partner?"))
        performDelete();
    } else {
      Alert.alert("Delete", "Are you sure?", [
        { text: "Cancel" },
        { text: "Delete", style: "destructive", onPress: performDelete },
      ]);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={{ flex: 1, backgroundColor: "#F0F2F5" }}
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name="truck-delivery"
              size={30}
              color="#fff"
            />
          </View>
          <Text style={styles.title}>Partner Registration</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>General Info</Text>
          <Input
            icon="office-building"
            placeholder="Company Name"
            value={form.Supplier}
            onChangeText={(val: string) => setForm({ ...form, Supplier: val })}
          />
          <Input
            icon="phone"
            placeholder="Phone / Email"
            value={form.Contact}
            onChangeText={(val: string) => setForm({ ...form, Contact: val })}
          />
          <Input
            icon="map-marker"
            placeholder="Physical Address"
            value={form.Address}
            onChangeText={(val: string) => setForm({ ...form, Address: val })}
            multiline
          />

          <Text style={styles.label}>License Document</Text>
          <TouchableOpacity
            style={styles.uploadBox}
            onPress={() => pickImage(false)}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#2196F3" />
            ) : form.License_Url ? (
              <Image
                source={{ uri: form.License_Url }}
                style={styles.previewImage}
              />
            ) : (
              <View style={{ alignItems: "center" }}>
                <MaterialCommunityIcons
                  name="camera-plus"
                  size={30}
                  color="#2196F3"
                />
                <Text style={styles.uploadText}>Upload License Image</Text>
              </View>
            )}
          </TouchableOpacity>

          <Input
            icon="calendar"
            placeholder="Expiry Date (YYYY-MM-DD)"
            value={form.Expiry_Date}
            onChangeText={(val: string) =>
              setForm({ ...form, Expiry_Date: val })
            }
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleSave}
            disabled={loading || uploading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Register Partner</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>
          Registered Partners ({list.length})
        </Text>
        {fetching ? (
          <ActivityIndicator color="#2196F3" />
        ) : (
          list.map((item) => (
            <View key={item.id} style={styles.listItem}>
              <Image
                source={{
                  uri: item.License_Url || "https://via.placeholder.com/50",
                }}
                style={styles.listThumb}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.Supplier}</Text>
                <Text style={styles.itemSub}>
                  {item.Address || "No Address"}
                </Text>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  onPress={() => {
                    setEditingItem(item);
                    setEditModalVisible(true);
                  }}
                >
                  <MaterialCommunityIcons
                    name="pencil"
                    size={20}
                    color="#2196F3"
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <MaterialCommunityIcons
                    name="delete"
                    size={20}
                    color="#F44336"
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* EDIT MODAL */}
      <Modal visible={isEditModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Partner</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {editingItem && (
              <ScrollView>
                {/* Company Name */}
                <Input
                  icon="office-building"
                  value={editingItem.Supplier}
                  onChangeText={(v: string) =>
                    setEditingItem({ ...editingItem, Supplier: v })
                  }
                />

                {/* Contact Info */}
                <Input
                  icon="phone"
                  value={editingItem.Contact}
                  onChangeText={(v: string) =>
                    setEditingItem({ ...editingItem, Contact: v })
                  }
                />

                {/* Address */}
                <Input
                  icon="map-marker"
                  value={editingItem.Address}
                  onChangeText={(v: string) =>
                    setEditingItem({ ...editingItem, Address: v })
                  }
                  multiline
                />

                {/* Expiry Date Update Field (Fixed) */}
                <Text style={styles.label}>Update Expiry Date</Text>
                <Input
                  icon="calendar"
                  placeholder="YYYY-MM-DD"
                  value={editingItem.Expiry_Date}
                  onChangeText={(v: string) =>
                    setEditingItem({ ...editingItem, Expiry_Date: v })
                  }
                />

                {/* License Image */}
                <Text style={styles.label}>License Image</Text>
                <TouchableOpacity
                  style={[styles.uploadBox, { height: 80 }]}
                  onPress={() => pickImage(true)}
                >
                  <Image
                    source={{ uri: editingItem.License_Url }}
                    style={styles.previewImage}
                  />
                  <div style={styles.editImageOverlay}>
                    <MaterialCommunityIcons
                      name="camera"
                      size={20}
                      color="#fff"
                    />
                  </div>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.button}
                  onPress={handleUpdate}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Update Changes</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const Input = ({ icon, value, onChangeText, ...props }: any) => (
  <View style={styles.inputWrapper}>
    <MaterialCommunityIcons name={icon} size={20} color="#2196F3" />
    <TextInput
      style={[
        styles.input,
        props.multiline && { height: 60, textAlignVertical: "top" },
      ]}
      value={value || ""}
      onChangeText={onChangeText} // Crucial fix for [object Object]
      placeholderTextColor="#999"
      {...props}
    />
  </View>
);

const styles = StyleSheet.create({
  header: { alignItems: "center", marginVertical: 20 },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  title: { fontSize: 22, fontWeight: "800", color: "#1A1C1E" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#666",
    marginBottom: 5,
    marginTop: 10,
    textTransform: "uppercase",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    marginBottom: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 14,
    marginLeft: 10,
    outlineStyle: "none",
    color: "#333",
  } as any,
  uploadBox: {
    height: 120,
    borderRadius: 12,
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#2196F3",
    backgroundColor: "#F0F7FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    overflow: "hidden",
  },
  previewImage: { width: "100%", height: "100%" },
  uploadText: {
    fontSize: 12,
    color: "#2196F3",
    marginTop: 5,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#2196F3",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 25,
    marginBottom: 15,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  listThumb: { width: 50, height: 50, borderRadius: 10, marginRight: 15 },
  itemName: { fontWeight: "700", fontSize: 15, color: "#333" },
  itemSub: { fontSize: 12, color: "#777" },
  actionButtons: { flexDirection: "row", gap: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "90%",
    maxWidth: 450,
    padding: 25,
    borderRadius: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "800" },
  editImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
});
