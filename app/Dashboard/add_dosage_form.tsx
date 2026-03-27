import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { supabase } from "@/src/supabaseClient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function AddDosageFormScreen({
  setActiveTab,
}: {
  setActiveTab: React.Dispatch<React.SetStateAction<any>>;
}) {
  const [dosageForm, setDosageForm] = useState("");
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDosageForms();
  }, []);

  const fetchDosageForms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("Drugs_Dosage_Form")
      .select("*")
      .order("Dosage_Form", { ascending: true });

    if (!error && data) {
      setList(data);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!dosageForm.trim()) {
      Alert.alert("Error", "Please enter a dosage form name.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from("Drugs_Dosage_Form")
      .insert([{ Dosage_Form: dosageForm.trim() }]);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setDosageForm("");
      fetchDosageForms();
      Alert.alert("Success", "Dosage form added successfully.");
    }
    setSubmitting(false);
  };

  const handleDelete = async (formName: string) => {
    Alert.alert("Confirm", `Delete "${formName}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase
            .from("Drugs_Dosage_Form")
            .delete()
            .eq("Dosage_Form", formName);
          if (!error) fetchDosageForms();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setActiveTab({ tab: "register_drugs" })}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Manage Dosage Forms</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          {/* Input Section */}
          <View style={styles.inputCard}>
            <Text style={styles.label}>New Dosage Form</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="e.g. Capsule, Oral Suspension"
                value={dosageForm}
                onChangeText={setDosageForm}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAdd}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* List Section */}
          <Text style={styles.sectionTitle}>Existing Forms</Text>
          {loading ? (
            <ActivityIndicator
              size="large"
              color="#007AFF"
              style={{ marginTop: 20 }}
            />
          ) : (
            <FlatList
              data={list}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  <View style={styles.listInfo}>
                    <MaterialCommunityIcons
                      name="beaker-outline"
                      size={20}
                      color="#007AFF"
                    />
                    <Text style={styles.listText}>{item.Dosage_Form}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(item.Dosage_Form)}
                  >
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={20}
                      color="#FF3B30"
                    />
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No dosage forms added yet.</Text>
              }
            />
          )}
        </View>
      </KeyboardAvoidingView>
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
    paddingBottom: 20,
    backgroundColor: "#fff",
  },
  title: { fontSize: 18, fontWeight: "900", color: "#1a1a1a" },
  content: { flex: 1, padding: 20 },
  inputCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: 25,
  },
  label: { fontSize: 13, fontWeight: "700", color: "#555", marginBottom: 8 },
  inputWrapper: { flexDirection: "row", alignItems: "center" },
  input: {
    flex: 1,
    backgroundColor: "#f1f3f5",
    padding: 12,
    borderRadius: 10,
    fontSize: 15,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: "#007AFF",
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#888",
    marginBottom: 15,
    textTransform: "uppercase",
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  listInfo: { flexDirection: "row", alignItems: "center" },
  listText: { fontSize: 15, fontWeight: "600", marginLeft: 10, color: "#333" },
  emptyText: { textAlign: "center", color: "#999", marginTop: 20 },
});
