import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { supabase } from "@/src/supabaseClient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Dropdown } from "react-native-element-dropdown";

export default function RegisterDrugsScreen() {
  const router = useRouter();
  // Get both parts of the primary key from params
  const { editId, batchNo } = useLocalSearchParams();

  const [categories, setCategories] = useState<any[]>([]);
  const [scientificNames, setScientificNames] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [identities, setIdentities] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [drugImage, setDrugImage] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [form, setForm] = useState({
    brandName: "",
    scientificName: "",
    batchNumber: "",
    unit: "",
    category: "",
    expiryDate: "",
    supplier: "",
    origin: "",
    price: "",
    quantity: "",
    description: "",
    identity: "",
  });

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await fetchDropdownData();
      // Use both parts of the key to initialize edit mode
      if (editId && batchNo) {
        setIsEditMode(true);
        await fetchDrugForEditing(editId as string, batchNo as string);
      }
      setLoading(false);
    };
    initialize();
  }, [editId, batchNo]);

  // --- CRUD: READ (Using Composite Key) ---
  const fetchDrugForEditing = async (id: string, batch: string) => {
    const { data, error } = await supabase
      .from("Drugs_Registration")
      .select("*")
      .eq("id", id)
      .eq("Batch_number", batch)
      .single();

    if (data && !error) {
      setForm({
        brandName: data.Drug_brand_name || "",
        scientificName: data.Scientific_name || "",
        batchNumber: data.Batch_number || "",
        unit: data.Unit || "",
        category: data.Drug_category || "",
        expiryDate: data.Expired_date || "",
        supplier: data.Supplier || "",
        origin: data.Origin || "",
        price: data.Price_per_unit?.toString() || "",
        quantity: data.Quantity_per_unit?.toString() || "",
        description: data.Description || "",
        identity: data.Product_identity || "",
      });
      if (data.Drug_image) {
        const { data: imgData } = supabase.storage
          .from("drug-images")
          .getPublicUrl(data.Drug_image);
        setDrugImage(imgData.publicUrl);
      }
    }
  };

  // --- CRUD: DELETE (Using Composite Key) ---
  const handleDelete = async () => {
    Alert.alert(
      "Delete Record",
      "This action cannot be undone. Remove this item?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("Drugs_Registration")
              .delete()
              .eq("id", editId)
              .eq("Batch_number", batchNo);

            if (!error) {
              Alert.alert("Success", "Medication record deleted.");
              router.replace("/../Dashboard/InventoryGridScreen");
            } else {
              Alert.alert("Error", error.message);
            }
          },
        },
      ],
    );
  };

  // --- CRUD: CREATE & UPDATE ---
  const handleSubmit = async () => {
    if (!form.brandName || !form.category || !form.quantity) {
      Alert.alert(
        "Validation",
        "Please fill Brand Name, Category, and Quantity.",
      );
      return;
    }

    setSubmitting(true);
    let uploadedImageName = null;

    try {
      if (drugImage && !drugImage.startsWith("http")) {
        const fileName = `${Date.now()}.jpg`;
        const response = await fetch(drugImage);
        const blob = await response.blob();
        await supabase.storage.from("drug-images").upload(fileName, blob);
        uploadedImageName = fileName;
      }

      const payload: any = {
        Drug_brand_name: form.brandName,
        Scientific_name: form.scientificName || null,
        Batch_number: form.batchNumber || null,
        Unit: form.unit || null,
        Drug_category: form.category,
        Expired_date: form.expiryDate.trim() === "" ? null : form.expiryDate,
        Supplier: form.supplier || null,
        Origin: form.origin || null,
        Price_per_unit: parseFloat(form.price) || 0,
        Quantity_per_unit: parseInt(form.quantity) || 0,
        Description: form.description || null,
        Product_identity: form.identity,
      };
      if (uploadedImageName) payload.Drug_image = uploadedImageName;

      const query = isEditMode
        ? supabase
            .from("Drugs_Registration")
            .update(payload)
            .eq("id", editId)
            .eq("Batch_number", batchNo) // Use composite key for update
        : supabase.from("Drugs_Registration").insert([payload]);

      const { error } = await query;
      if (error) throw error;

      Alert.alert(
        "Success",
        isEditMode ? "Inventory Updated!" : "Medication Registered!",
      );
      if (!isEditMode) resetForm();
      else router.replace("/../Dashboard/InventoryGridScreen");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      brandName: "",
      scientificName: "",
      batchNumber: "",
      unit: "",
      category: "",
      expiryDate: "",
      supplier: "",
      origin: "",
      price: "",
      quantity: "",
      description: "",
      identity: "",
    });
    setDrugImage(null);
  };

  const fetchDropdownData = async () => {
    try {
      const [
        resCats,
        resSci,
        resUnits,
        resSuppliers,
        resIdentities,
        resCountries,
      ] = await Promise.all([
        supabase.from("Drugs_Categories").select("Categories"),
        supabase.from("Drugs_Scientific_Name").select("Scientific_Name"),
        supabase.from("Drugs_Unit").select("Unit"),
        supabase.from("Drugs_Supplier").select("Supplier"),
        supabase.from("Drugs_Product_Identity").select("Product_Identity"),
        fetch("https://restcountries.com/v3.1/all?fields=name"),
      ]);
      if (resCats.data) setCategories(resCats.data);
      if (resSci.data) setScientificNames(resSci.data);
      if (resUnits.data) setUnits(resUnits.data);
      if (resSuppliers.data) setSuppliers(resSuppliers.data);
      if (resIdentities.data) setIdentities(resIdentities.data);
      const countryJson = await resCountries.json();
      setCountries(
        countryJson
          .map((c: any) => ({ label: c.name.common, value: c.name.common }))
          .sort((a: any, b: any) => a.label.localeCompare(b.label)),
      );
    } catch (e) {
      console.error(e);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) setDrugImage(result.assets[0].uri);
  };

  if (loading)
    return (
      <ActivityIndicator size="large" color="#007AFF" style={{ flex: 1 }} />
    );

  return (
    <View style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {isEditMode ? "Edit Record" : "Register Item"}
              </Text>
              <Text style={styles.subtitle}>Pharma Control System</Text>
            </View>
            <TouchableOpacity
              style={styles.viewRegisteredBtn}
              onPress={() => router.push("/../Dashboard/InventoryGridScreen")}
            >
              <MaterialCommunityIcons
                name="format-list-bulleted"
                size={18}
                color="#fff"
              />
              <Text style={styles.viewBtnText}>View Items</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Primary Information</Text>
            <InputField
              label="Brand Name"
              placeholder="e.g. Advil"
              value={form.brandName}
              onChangeText={(txt: string) =>
                setForm({ ...form, brandName: txt })
              }
            />

            <DropdownField
              label="Product Identity"
              data={identities}
              labelField="Product_Identity"
              valueField="Product_Identity"
              placeholder="Select Identity Type"
              value={form.identity}
              icon="fingerprint"
              onChange={(item: any) =>
                setForm({ ...form, identity: item.Product_Identity })
              }
            />

            <DropdownField
              label="Scientific Name"
              data={scientificNames}
              labelField="Scientific_Name"
              valueField="Scientific_Name"
              placeholder="Molecule Name"
              value={form.scientificName}
              icon="flask-outline"
              onChange={(item: any) =>
                setForm({ ...form, scientificName: item.Scientific_Name })
              }
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <DropdownField
                  label="Category"
                  data={categories}
                  labelField="Categories"
                  valueField="Categories"
                  placeholder="Category"
                  value={form.category}
                  icon="tag-outline"
                  onChange={(item: any) =>
                    setForm({ ...form, category: item.Categories })
                  }
                />
              </View>
              <View style={{ flex: 1 }}>
                <DropdownField
                  label="Unit"
                  data={units}
                  labelField="Unit"
                  valueField="Unit"
                  placeholder="Unit"
                  value={form.unit}
                  icon="pill"
                  onChange={(item: any) =>
                    setForm({ ...form, unit: item.Unit })
                  }
                />
              </View>
            </View>

            <Text style={styles.sectionLabel}>Traceability & Stocks</Text>
            <InputField
              label="Batch Number"
              placeholder="Lot / Batch #"
              value={form.batchNumber}
              onChangeText={(txt: string) =>
                setForm({ ...form, batchNumber: txt })
              }
            />
            <InputField
              label="Expiry Date"
              placeholder="YYYY-MM-DD"
              value={form.expiryDate}
              onChangeText={(txt: string) =>
                setForm({ ...form, expiryDate: txt })
              }
            />

            <DropdownField
              label="Supplier"
              data={suppliers}
              labelField="Supplier"
              valueField="Supplier"
              placeholder="Source Supplier"
              value={form.supplier}
              icon="truck-delivery-outline"
              onChange={(item: any) =>
                setForm({ ...form, supplier: item.Supplier })
              }
            />

            <DropdownField
              label="Country of Origin"
              data={countries}
              labelField="label"
              valueField="value"
              placeholder="Origin"
              value={form.origin}
              icon="earth"
              onChange={(item: any) => setForm({ ...form, origin: item.value })}
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <InputField
                  label="Price (ETB)"
                  keyboardType="numeric"
                  value={form.price}
                  onChangeText={(txt: string) =>
                    setForm({ ...form, price: txt })
                  }
                />
              </View>
              <View style={{ flex: 1 }}>
                <InputField
                  label="Stock Quantity"
                  keyboardType="numeric"
                  value={form.quantity}
                  onChangeText={(txt: string) =>
                    setForm({ ...form, quantity: txt })
                  }
                />
              </View>
            </View>

            <InputField
              label="Additional Notes"
              placeholder="Special storage..."
              multiline
              numberOfLines={3}
              style={styles.textArea}
              value={form.description}
              onChangeText={(txt: string) =>
                setForm({ ...form, description: txt })
              }
            />

            <Text style={styles.sectionLabel}>Media</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {drugImage ? (
                <Image
                  source={{ uri: drugImage }}
                  style={styles.previewImage}
                />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <MaterialCommunityIcons
                    name="camera-plus"
                    size={32}
                    color="#007AFF"
                  />
                  <Text style={styles.uploadText}>Add Product Photo</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                isEditMode && { backgroundColor: "#28a745" },
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting
                  ? "Saving..."
                  : isEditMode
                    ? "Save Changes"
                    : "Confirm Registration"}
              </Text>
            </TouchableOpacity>

            {isEditMode && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={20}
                  color="#FF3B30"
                />
                <Text style={styles.deleteBtnText}>Delete This Record</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const DropdownField = ({ label, icon, ...props }: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <Dropdown
      style={styles.dropdown}
      placeholderStyle={styles.placeholderStyle}
      selectedTextStyle={styles.selectedTextStyle}
      search
      maxHeight={300}
      renderLeftIcon={() => (
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color="#999"
          style={{ marginRight: 8 }}
        />
      )}
      {...props}
    />
  </View>
);

const InputField = ({ label, style, ...props }: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, style]}
      placeholderTextColor="#999"
      {...props}
    />
  </View>
);

const styles = StyleSheet.create({
  scrollContainer: { padding: 20, paddingBottom: 60 },
  header: {
    marginBottom: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 24, fontWeight: "900", color: "#1a1a1a" },
  subtitle: { fontSize: 13, color: "#888" },
  viewRegisteredBtn: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  viewBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#007AFF",
    textTransform: "uppercase",
    marginVertical: 15,
    letterSpacing: 0.5,
  },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 13, fontWeight: "700", color: "#555", marginBottom: 6 },
  input: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#eee",
    color: "#000",
  },
  dropdown: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    borderWidth: 1,
    borderColor: "#eee",
  },
  placeholderStyle: { fontSize: 15, color: "#999" },
  selectedTextStyle: { fontSize: 15, color: "#000" },
  textArea: { height: 80, textAlignVertical: "top" },
  row: { flexDirection: "row" },
  submitButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  deleteBtnText: { color: "#FF3B30", fontWeight: "700", marginLeft: 8 },
  imagePicker: {
    width: "100%",
    height: 160,
    borderRadius: 14,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#eee",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  previewImage: { width: "100%", height: "100%", resizeMode: "cover" },
  uploadPlaceholder: { alignItems: "center" },
  uploadText: {
    marginTop: 8,
    color: "#007AFF",
    fontWeight: "600",
    fontSize: 12,
  },
});
