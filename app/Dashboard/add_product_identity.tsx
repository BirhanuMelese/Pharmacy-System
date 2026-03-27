import { supabase } from "@/src/supabaseClient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AddProductIdentity() {
  const [identity, setIdentity] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [recentIds, setRecentIds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // --- 1. FETCH (READ) ---
  const fetchIdentities = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("Drugs_Product_Identity")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      Alert.alert("Fetch Error", error.message);
    } else {
      setRecentIds(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchIdentities();
  }, []);

  // --- 2. INSERT / UPDATE (CREATE/EDIT) ---
  const handleRegister = async () => {
    if (!identity.trim()) return;

    setLoading(true);
    if (editingId) {
      // UPDATE Logic
      const { error } = await supabase
        .from("Drugs_Product_Identity")
        .update({ Product_Identity: identity })
        .eq("id", editingId);

      if (error) Alert.alert("Update Error", error.message);
      else {
        setEditingId(null);
        setIdentity("");
      }
    } else {
      // INSERT Logic
      const { error } = await supabase
        .from("Drugs_Product_Identity")
        .insert([{ Product_Identity: identity }]);

      if (error) Alert.alert("Insert Error", error.message);
      else setIdentity("");
    }

    fetchIdentities();
  };

  // --- 3. DELETE ---
  const handleDelete = (id: number) => {
    Alert.alert(
      "Delete Identity",
      "Remove this product identity permanently?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("Drugs_Product_Identity")
              .delete()
              .eq("id", id);
            if (error) Alert.alert("Delete Error", error.message);
            fetchIdentities();
          },
        },
      ],
    );
  };

  // --- 4. PREPARE EDIT ---
  const startEdit = (item: any) => {
    setIdentity(item.Product_Identity);
    setEditingId(item.id);
  };

  // --- 5. SEARCH FILTER ---
  const filteredData = recentIds.filter((item) =>
    item.Product_Identity.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <MaterialCommunityIcons name="barcode-scan" size={30} color="#fff" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Product Identity</Text>
          <Text style={styles.subtitle}>Manage SKU & Barcode records</Text>
        </View>
      </View>

      {/* INPUT CARD */}
      <View style={styles.card}>
        <Text style={styles.label}>
          {editingId ? "Edit Identity" : "New Identity / SKU"}
        </Text>
        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons name="identifier" size={20} color="#007BFF" />
          <TextInput
            placeholder="e.g. BRC-882-99"
            placeholderTextColor="#aaa"
            style={styles.input}
            value={identity}
            onChangeText={setIdentity}
          />
          {editingId && (
            <TouchableOpacity
              onPress={() => {
                setEditingId(null);
                setIdentity("");
              }}
            >
              <MaterialCommunityIcons
                name="close-circle"
                size={20}
                color="#ff4d4d"
              />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, !identity && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={!identity || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.buttonText}>
                {editingId ? "Update" : "Register"}
              </Text>
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color="#fff"
              />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#A3AED0" />
        <TextInput
          placeholder="Search identities..."
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* LIST SECTION */}
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Database Entries</Text>
        <TouchableOpacity onPress={fetchIdentities}>
          <MaterialCommunityIcons name="refresh" size={20} color="#007BFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.historyItem}>
            <TouchableOpacity
              style={styles.itemContent}
              onPress={() => startEdit(item)}
            >
              <View style={styles.idCircle}>
                <MaterialCommunityIcons
                  name="tag-outline"
                  size={16}
                  color="#666"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemCode}>{item.Product_Identity}</Text>
                <Text style={styles.itemDate}>ID: #{item.id}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDelete(item.id)}
              style={styles.deleteBtn}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={22}
                color="#ff4d4d"
              />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text
            style={{ textAlign: "center", marginTop: 20, color: "#A3AED0" }}
          >
            No identities found.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FE", padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
    marginTop: 10,
  },
  iconBox: {
    backgroundColor: "#007BFF",
    padding: 12,
    borderRadius: 12,
    elevation: 4,
  },
  headerText: { marginLeft: 15 },
  title: { fontSize: 24, fontWeight: "800", color: "#1B2559" },
  subtitle: { fontSize: 14, color: "#A3AED0" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#707EAE",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F7FE",
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#E0E5F2",
  },
  input: {
    flex: 1,
    height: 50,
    marginLeft: 10,
    fontSize: 16,
    color: "#1B2559",
  },
  button: {
    backgroundColor: "#007BFF",
    flexDirection: "row",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
    gap: 10,
  },
  buttonDisabled: { backgroundColor: "#E0E5F2" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 45,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E5F2",
  },
  searchInput: { flex: 1, marginLeft: 10, color: "#1B2559" },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  historyTitle: { fontSize: 18, fontWeight: "700", color: "#1B2559" },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  itemContent: { flex: 1, flexDirection: "row", alignItems: "center" },
  idCircle: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: "#F4F7FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  itemCode: { fontSize: 15, fontWeight: "700", color: "#1B2559" },
  itemDate: { fontSize: 11, color: "#A3AED0" },
  deleteBtn: { padding: 5 },
});
