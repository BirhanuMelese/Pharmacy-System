import { supabase } from "@/src/supabaseClient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function InventoryGridScreen({
  setActiveTab,
}: {
  setActiveTab: React.Dispatch<
    React.SetStateAction<{
      tab:
        | "register_drugs"
        | "inventory"
        | "dashboard"
        | "update_price"
        | "add_drugs_categories"
        | "add_drugs_unit"
        | "add_suppliers"
        | "add_product_identity"
        | "add_scientific_name";
      editId?: string;
      batchNo?: string;
    }>
  >;
}) {
  const [drugs, setDrugs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    // Removed .order("created_at") to prevent the error
    const { data, error } = await supabase
      .from("Drugs_Registration")
      .select("*")
      .order("id", { ascending: false }); // Sort by ID instead

    if (!error && data) {
      setDrugs(data);
    } else if (error) {
      console.error("Fetch error:", error.message);
      // Fallback: fetch without any ordering if ID also fails
      const { data: retryData } = await supabase
        .from("Drugs_Registration")
        .select("*");
      if (retryData) setDrugs(retryData);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInventory();
    setRefreshing(false);
  };

  // Filter includes Brand Name, Scientific Name, Dosage, or Dosage Form
  const filteredDrugs = drugs.filter(
    (item) =>
      item.Drug_brand_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.Scientific_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.dosage?.toLowerCase().includes(search.toLowerCase()) ||
      item.dosage_form?.toLowerCase().includes(search.toLowerCase()),
  );

  const renderItem = ({ item }: { item: any }) => {
    const imageUrl = item.Drug_image
      ? supabase.storage.from("drug-images").getPublicUrl(item.Drug_image).data
          ?.publicUrl
      : null;

    // Logic for Low Stock warning (less than 10)
    const isLowStock = (parseInt(item.Quantity_per_unit) || 0) < 10;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          setActiveTab({
            tab: "register_drugs",
            editId: item.id?.toString(),
            batchNo: item.Batch_number,
          })
        }
      >
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.drugImage} />
          ) : (
            <View style={styles.placeholderIcon}>
              <MaterialCommunityIcons name="pill" size={40} color="#ccc" />
            </View>
          )}
          {isLowStock && (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockText}>LOW STOCK</Text>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.brandName} numberOfLines={1}>
            {item.Drug_brand_name}
          </Text>

          <Text style={styles.scientificName} numberOfLines={1}>
            {item.Scientific_name || "Generic N/A"}
          </Text>

          <Text style={styles.dosageText} numberOfLines={1}>
            {item.dosage || ""} {item.dosage_form || ""}
          </Text>

          <View style={styles.stockRow}>
            <Text style={[styles.qty, isLowStock && styles.lowStockColor]}>
              Qty: {item.Quantity_per_unit || 0}
            </Text>
            <Text style={styles.price}>{item.Price_per_unit} ETB</Text>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.category} numberOfLines={1}>
              {item.Drug_category || "General"}
            </Text>
            <Text style={styles.batchText}>B: {item.Batch_number}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setActiveTab({ tab: "dashboard" })}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Inventory Grid</Text>
        <TouchableOpacity onPress={fetchInventory}>
          <MaterialCommunityIcons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={20} color="#999" />
        <TextInput
          placeholder="Search inventory..."
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filteredDrugs}
          keyExtractor={(item, index) => item.id?.toString() + index}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.columnWrapper}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#007AFF"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={50}
                color="#ccc"
              />
              <Text style={styles.emptyText}>No medications found.</Text>
            </View>
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
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
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
    height: 48,
    borderWidth: 1,
    borderColor: "#eee",
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  list: { padding: 10, paddingBottom: 100 },
  columnWrapper: { justifyContent: "space-between" },
  card: {
    backgroundColor: "#fff",
    width: "48%",
    borderRadius: 16,
    marginBottom: 15,
    padding: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  imageContainer: {
    height: 110,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    overflow: "hidden",
    position: "relative",
  },
  drugImage: { width: "100%", height: "100%", resizeMode: "contain" },
  placeholderIcon: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f2f5",
  },
  lowStockBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "#FF3B30",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lowStockText: { color: "#fff", fontSize: 8, fontWeight: "900" },
  info: { gap: 1 },
  brandName: { fontWeight: "900", fontSize: 14, color: "#1a1a1a" },
  scientificName: { fontSize: 11, color: "#666", fontStyle: "italic" },
  dosageText: {
    fontSize: 12,
    color: "#444",
    fontWeight: "600",
    marginBottom: 4,
  },
  category: { fontSize: 10, color: "#007AFF", fontWeight: "700", flex: 1 },
  stockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 4,
  },
  qty: { fontSize: 11, color: "#666", fontWeight: "700" },
  lowStockColor: { color: "#FF3B30" },
  price: { fontSize: 12, fontWeight: "800", color: "#28a745" },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  batchText: { fontSize: 9, color: "#bbb" },
  emptyContainer: { alignItems: "center", marginTop: 100 },
  emptyText: {
    textAlign: "center",
    marginTop: 10,
    color: "#999",
    fontSize: 15,
  },
});
