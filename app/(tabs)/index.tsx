import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SearchBar } from "@rneui/base";
import React, { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Import your screen components
import InventoryGridScreen from "@/Dashboard/InventoryGridScreen";
import RegisterDrugsScreen from "@/Dashboard/register_drugs";
import AddDosageForm from "../Dashboard/add_dosage_form"; // 1. Import new component
import AddDrugsCategories from "../Dashboard/add_drugs_categories";
import AddProductIdentity from "../Dashboard/add_product_identity";
import AddScientificName from "../Dashboard/add_scientific_name";
import AddSuppliers from "../Dashboard/add_suppliers";
import AddDrugsUnit from "../Dashboard/add_unit";
import UpdatePrice from "../Dashboard/update_price";

export default function HomeScreen() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);

  // 2. Added "add_dosage_form" to the type definition
  const [activeTab, setActiveTab] = useState<{
    tab:
      | "dashboard"
      | "update_price"
      | "register_drugs"
      | "inventory"
      | "add_drugs_categories"
      | "add_drugs_unit"
      | "add_dosage_form" // Added here
      | "add_suppliers"
      | "add_product_identity"
      | "add_scientific_name";
    editId?: string;
    batchNo?: string;
  }>({ tab: "dashboard" });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* SIDEBAR */}
        <View style={[styles.sidebar, { width: isCollapsed ? 80 : 280 }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* TOGGLE BUTTON */}
            <Pressable
              onPress={() => setIsCollapsed(!isCollapsed)}
              style={styles.toggleBtn}
            >
              <MaterialCommunityIcons
                name={isCollapsed ? "menu-open" : "menu"}
                size={24}
                color="#2196F3"
              />
            </Pressable>

            <View style={styles.logoContainer}>
              <Text
                style={[
                  styles.logoText,
                  isCollapsed && { opacity: 0, height: 0 },
                ]}
              >
                Pharmacy Admin
              </Text>
            </View>

            {/* MAIN BUTTONS */}
            <NavButton
              icon="view-dashboard-outline"
              label="Dashboard"
              active={activeTab.tab === "dashboard"}
              isCollapsed={isCollapsed}
              onPress={() => setActiveTab({ tab: "dashboard" })}
            />

            <NavButton
              label="Registration"
              icon={isRegistrationOpen ? "chevron-up" : "chevron-down"}
              onPress={() => setIsRegistrationOpen(!isRegistrationOpen)}
              active={activeTab.tab === "register_drugs"}
              isCollapsed={isCollapsed}
            />

            {/* DROPDOWN ITEMS */}
            {isRegistrationOpen && !isCollapsed && (
              <View style={styles.dropdownContainer}>
                <NavButton
                  icon="pill"
                  label="Register Drugs"
                  active={activeTab.tab === "register_drugs"}
                  isCollapsed={isCollapsed}
                  onPress={() => setActiveTab({ tab: "register_drugs" })}
                />
                <NavButton
                  icon="flask-outline"
                  label="New Batch"
                  isCollapsed={isCollapsed}
                />
                <NavButton
                  icon="currency-usd"
                  label="Update Price"
                  isCollapsed={isCollapsed}
                  onPress={() => setActiveTab({ tab: "update_price" })}
                />
                <NavButton
                  icon="tag-outline"
                  label="Categories"
                  isCollapsed={isCollapsed}
                  onPress={() => setActiveTab({ tab: "add_drugs_categories" })}
                />

                {/* 3. Added Dosage Form NavButton */}
                <NavButton
                  icon="beaker-outline"
                  label="Dosage Forms"
                  active={activeTab.tab === "add_dosage_form"}
                  isCollapsed={isCollapsed}
                  onPress={() => setActiveTab({ tab: "add_dosage_form" })}
                />

                <NavButton
                  icon="test-tube"
                  label="Scientific Name"
                  isCollapsed={isCollapsed}
                  onPress={() => setActiveTab({ tab: "add_scientific_name" })}
                />
                <NavButton
                  icon="scale-balance"
                  label="Units"
                  isCollapsed={isCollapsed}
                  onPress={() => setActiveTab({ tab: "add_drugs_unit" })}
                />

                <NavButton
                  icon="truck-delivery"
                  label="Suppliers"
                  isCollapsed={isCollapsed}
                  onPress={() => setActiveTab({ tab: "add_suppliers" })}
                />
                <NavButton
                  icon="barcode-scan"
                  label="Product Identity"
                  isCollapsed={isCollapsed}
                  onPress={() => setActiveTab({ tab: "add_product_identity" })}
                />
              </View>
            )}
          </ScrollView>
        </View>

        {/* MAIN CONTENT */}
        <View style={styles.mainContent}>
          <View style={styles.topBar}>
            <SearchBar
              placeholder="Search..."
              containerStyle={styles.searchContainer}
              inputContainerStyle={styles.searchInput}
              value=""
            />
            <Image
              style={styles.profileImage}
              source={require("../../assets/images/profile.jpg")}
            />
          </View>

          <View style={styles.contentArea}>
            {/* CONDITIONAL RENDERING */}
            {activeTab.tab === "dashboard" && (
              <View>
                <Text style={styles.welcomeText}>
                  {isCollapsed ? "Dashboard" : "Welcome back, Admin"}
                </Text>
              </View>
            )}

            {activeTab.tab === "register_drugs" && (
              <RegisterDrugsScreen
                setActiveTab={setActiveTab}
                editId={activeTab.editId}
                batchNo={activeTab.batchNo}
              />
            )}
            {activeTab.tab === "inventory" && (
              <InventoryGridScreen setActiveTab={setActiveTab} />
            )}
            {activeTab.tab === "update_price" && <UpdatePrice />}
            {activeTab.tab === "add_drugs_categories" && <AddDrugsCategories />}
            {activeTab.tab === "add_drugs_unit" && <AddDrugsUnit />}

            {/* 4. Added new screen component to content area */}
            {activeTab.tab === "add_dosage_form" && (
              <AddDosageForm setActiveTab={setActiveTab} />
            )}

            {activeTab.tab === "add_suppliers" && <AddSuppliers />}
            {activeTab.tab === "add_product_identity" && <AddProductIdentity />}
            {activeTab.tab === "add_scientific_name" && <AddScientificName />}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

// --- NAV BUTTON COMPONENT ---
type NavButtonProps = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  active?: boolean;
  isCollapsed: boolean;
  onPress?: () => void;
};

const NavButton: React.FC<NavButtonProps> = ({
  icon,
  label,
  active,
  isCollapsed,
  onPress,
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.navItem,
      active && styles.navItemActive,
      pressed && { opacity: 0.7 },
      isCollapsed && { justifyContent: "center", paddingHorizontal: 0 },
    ]}
  >
    <MaterialCommunityIcons
      name={icon}
      size={22}
      color={active ? "#2196F3" : "#666"}
    />
    {!isCollapsed && (
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>
        {label}
      </Text>
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8F9FA" },
  container: { flex: 1, flexDirection: "row" },
  sidebar: {
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderRightColor: "#E0E0E0",
    paddingTop: 10,
    paddingHorizontal: 12,
  },
  dropdownContainer: {
    marginLeft: 15,
    borderLeftWidth: 1,
    borderLeftColor: "#E0E0E0",
    paddingLeft: 10,
    marginTop: -5,
    marginBottom: 10,
  },
  toggleBtn: { alignSelf: "flex-end", padding: 10 },
  logoContainer: { paddingBottom: 20, alignItems: "center" },
  logoText: { fontSize: 18, fontWeight: "bold", color: "#2196F3" },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  navItemActive: { backgroundColor: "#E3F2FD" },
  navLabel: { marginLeft: 12, fontSize: 14, color: "#555", fontWeight: "500" },
  navLabelActive: { color: "#2196F3", fontWeight: "600" },
  mainContent: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    height: 60,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  searchContainer: {
    backgroundColor: "transparent",
    borderBottomColor: "transparent",
    borderTopColor: "transparent",
    width: "50%",
    padding: 0,
  },
  searchInput: { backgroundColor: "#F1F3F4", borderRadius: 10, height: 35 },
  profileImage: { width: 35, height: 35, borderRadius: 17.5 },
  contentArea: { padding: 20, flex: 1 },
  welcomeText: { fontSize: 22, fontWeight: "bold", color: "#333" },
});
