import { supabase } from "@/src/supabaseClient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function InventoryGridScreen() {
  const router = useRouter();
  const [drugs, setDrugs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("Drugs_Registration")
      .select(" *, Drug_category(Drug_category), Batch_number");

    if (!error && data) {
      setDrugs(data);
    } else if (error) {
      console.error("Fetch error:", error.message);
    }
    setLoading(false);
  };

  const filteredDrugs = drugs.filter((item) =>
    item.Drug_brand_name?.toLowerCase().includes(search.toLowerCase()),
  );

  const renderItem = ({ item }: { item: any }) => {
    const imageUrl = item.Drug_image
      ? supabase.storage.from("drug-images").getPublicUrl(item.Drug_image).data
          ?.publicUrl
      : null;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: "../Dashboard/register_drugs",
            params: {
              editId: item.id,
              batchNo: item.Batch_number, // Sending composite key
            },
          })
        }
      >
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.drugImage} />
          ) : (
            <MaterialCommunityIcons name="pill" size={40} color="#ccc" />
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.brandName} numberOfLines={1}>
            {item.Drug_brand_name}
          </Text>
          <Text style={styles.category}>
            {item.Drug_category || "No Category"}
          </Text>
          <View style={styles.stockRow}>
            <Text style={styles.qty}>Qty: {item.Quantity_per_unit || 0}</Text>
            <Text style={styles.price}>{item.Price_per_unit} ETB</Text>
          </View>
          <Text style={styles.batchText}>Batch: {item.Batch_number}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Inventory List</Text>
        <TouchableOpacity onPress={fetchInventory}>
          <MaterialCommunityIcons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={20} color="#999" />
        <TextInput
          placeholder="Search by brand name..."
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filteredDrugs}
          keyExtractor={(item, index) => item.id?.toString() + index}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.columnWrapper}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No medications found.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
    backgroundColor: "#fff",
  },
  title: { fontSize: 20, fontWeight: "900" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    height: 45,
    borderWidth: 1,
    borderColor: "#eee",
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  list: { padding: 10 },
  columnWrapper: { justifyContent: "space-between" },
  card: {
    backgroundColor: "#fff",
    width: "48%",
    borderRadius: 15,
    marginBottom: 15,
    padding: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  imageContainer: {
    height: 100,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    overflow: "hidden",
  },
  drugImage: { width: "100%", height: "100%", resizeMode: "cover" },
  info: { gap: 2 },
  brandName: { fontWeight: "800", fontSize: 14, color: "#333" },
  category: { fontSize: 11, color: "#007AFF", fontWeight: "600" },
  stockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  qty: { fontSize: 11, color: "#666" },
  price: { fontSize: 11, fontWeight: "700", color: "#28a745" },
  batchText: { fontSize: 10, color: "#999", marginTop: 2 },
  emptyText: { textAlign: "center", marginTop: 50, color: "#999" },
});
