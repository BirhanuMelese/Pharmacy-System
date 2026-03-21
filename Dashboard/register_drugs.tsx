import React from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function RegisterDrugsScreen() {
  const handleSubmit = () => alert("Drug Registered Successfully! 🎉");

  return (
    // We use flex: 1 here so it fills the 'contentArea' from the parent
    <View style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={80} // Adjust this if the keyboard still covers inputs
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          // Makes it look cleaner
        >
          <View style={styles.header}>
            <Text style={styles.title}>New Medication</Text>
            <Text style={styles.subtitle}>
              Enter the drug details below to update inventory.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionLabel}>General Information</Text>
            <InputField label="Internal ID" placeholder="e.g. ADV-001" />
            <InputField label="Drug Brand Name" placeholder="e.g. Advil" />
            <InputField label="Scientific Name" placeholder="e.g. Ibuprofen" />
            <InputField label="Unit" placeholder="e.g. PK, ST" />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <InputField label="Batch Number" placeholder="BN-992" />
              </View>
              <View style={{ flex: 1 }}>
                <InputField
                  label="Quantity"
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={styles.sectionLabel}>Logistics & Dates</Text>
            <InputField label="Expired Date" placeholder="YYYY-MM-DD" />
            <InputField label="Supplier" placeholder="Global Pharma Co." />
            <InputField label="Origin" placeholder="e.g. USA, Germany" />
            <InputField
              label="Price per Unit"
              placeholder="0.00"
              keyboardType="numeric"
            />

            <InputField
              label="Description"
              placeholder="Additional notes..."
              multiline
              numberOfLines={3}
              style={styles.textArea}
            />
            <InputField
              label="Product Identity"
              placeholder="Drugs or Cosmotics"
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Register Drug</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

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
  scrollContainer: {
    padding: 20,
    paddingBottom: 60, // Extra padding at the bottom so the button isn't cramped
  },
  header: {
    marginBottom: 25,
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    // Standard shadow for iOS/Web
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    // Elevation for Android
    elevation: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#007AFF",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 15,
    marginTop: 10,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#f1f3f5",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: "#000",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
