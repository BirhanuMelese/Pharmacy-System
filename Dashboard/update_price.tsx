import { supabase } from "@/src/supabaseClient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function UpdatePrice() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<
    "Batch_number" | "Drug_brand_name"
  >("Batch_number");
  const [newPrice, setNewPrice] = useState("");
  const [recordedPrice, setRecordedPrice] = useState<string | null>(null);
  const [drugDetails, setDrugDetails] = useState<{
    name: string;
    batch: string;
  } | null>(null);
  const [searching, setSearching] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Fetch current record based on selected filter
  const handleSearch = async () => {
    if (!searchQuery) return;

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("Drugs_Registration")
        .select("Drug_brand_name, Price_per_unit, Batch_number")
        .eq(searchType, searchQuery)
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        setDrugDetails({
          name: data.Drug_brand_name,
          batch: data.Batch_number,
        });
        setRecordedPrice(data.Price_per_unit.toString());
        setNewPrice(data.Price_per_unit.toString());
      }
    } catch (error: any) {
      Alert.alert(
        "Not Found",
        `No record found for this ${searchType.replace("_", " ")}.`,
      );
      resetFields();
    } finally {
      setSearching(false);
    }
  };

  const resetFields = () => {
    setDrugDetails(null);
    setRecordedPrice(null);
    setNewPrice("");
  };

  const handleUpdate = async () => {
    if (!drugDetails) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from("Drugs_Registration")
        .update({ Price_per_unit: parseFloat(newPrice) })
        .eq("Batch_number", drugDetails.batch); // Always use Batch for precision during update

      if (error) throw error;
      Alert.alert("Success", "Price updated successfully! 🎉");
      setRecordedPrice(newPrice);
    } catch (error: any) {
      Alert.alert("Update Error", error.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Price Management</Text>

      <View style={styles.card}>
        {/* Filter Toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              searchType === "Batch_number" && styles.activeToggle,
            ]}
            onPress={() => {
              setSearchType("Batch_number");
              resetFields();
            }}
          >
            <Text
              style={[
                styles.toggleText,
                searchType === "Batch_number" && styles.activeToggleText,
              ]}
            >
              By Batch
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              searchType === "Drug_brand_name" && styles.activeToggle,
            ]}
            onPress={() => {
              setSearchType("Drug_brand_name");
              resetFields();
            }}
          >
            <Text
              style={[
                styles.toggleText,
                searchType === "Drug_brand_name" && styles.activeToggleText,
              ]}
            >
              By Name
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchRow}>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons
              name={searchType === "Batch_number" ? "layers-outline" : "pill"}
              size={20}
              color="#666"
            />
            <TextInput
              placeholder={`Search ${searchType === "Batch_number" ? "Batch #" : "Brand Name"}...`}
              style={styles.input}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            {searching ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <MaterialCommunityIcons name="magnify" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Display Current Recorded Info */}
        {recordedPrice !== null && drugDetails && (
          <View style={styles.resultContainer}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Found Record:</Text>
              <Text style={styles.infoValue}>
                {drugDetails.name} (Batch: {drugDetails.batch})
              </Text>
            </View>

            <View style={styles.priceHighlight}>
              <Text style={styles.priceLabel}>Current Price in Database:</Text>
              <Text style={styles.priceValue}>{recordedPrice} ETB</Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.label}>New Unit Price:</Text>
            <View style={[styles.inputWrapper, { marginTop: 8 }]}>
              <MaterialCommunityIcons
                name="cash-edit"
                size={20}
                color="#2196F3"
              />
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={newPrice}
                onChangeText={setNewPrice}
              />
            </View>

            <TouchableOpacity
              style={[styles.updateBtn, updating && { opacity: 0.7 }]}
              onPress={handleUpdate}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Update Price</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F8F9FA" },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 20,
    color: "#1a1a1a",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    elevation: 4,
  },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: "#f1f3f5",
    borderRadius: 10,
    padding: 4,
    marginBottom: 15,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  activeToggle: { backgroundColor: "#fff", elevation: 2 },
  toggleText: { color: "#666", fontWeight: "600" },
  activeToggleText: { color: "#2196F3" },
  searchRow: { flexDirection: "row", gap: 10, marginBottom: 15 },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  input: { flex: 1, height: 48, marginLeft: 8, fontSize: 16 },
  searchBtn: {
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 10,
    justifyContent: "center",
  },
  resultContainer: { marginTop: 10 },
  infoBox: { marginBottom: 15 },
  infoLabel: {
    fontSize: 12,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  infoValue: { fontSize: 16, fontWeight: "700", color: "#333" },
  priceHighlight: {
    backgroundColor: "#E3F2FD",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  priceLabel: {
    color: "#1976D2",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 5,
  },
  priceValue: { fontSize: 28, fontWeight: "900", color: "#1976D2" },
  divider: { height: 1, backgroundColor: "#f0f0f0", marginVertical: 20 },
  label: { fontSize: 14, color: "#555", fontWeight: "600" },
  updateBtn: {
    backgroundColor: "#00C853",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 17 },
});
