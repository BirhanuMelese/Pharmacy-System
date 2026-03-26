import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = "https://jgudrfkztrbtulhucrgg.supabase.co";
const supabaseAnonKey = "sb_publishable_shSKgK4ZeWr2DgqxW8b8qQ_8LEYV9w0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
