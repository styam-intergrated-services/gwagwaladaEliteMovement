import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function useRole() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching roles:", error);
        setRoles([]);
      } else {
        setRoles(data.map((r) => r.role));
      }
      setLoading(false);
    };

    fetchRoles();
  }, [user]);

  const hasRole = (role: string) => roles.includes(role);
  const isAdmin = hasRole("admin");
  const isModerator = hasRole("moderator") || isAdmin;
  const isVerifiedTrader = hasRole("verified_trader") || isAdmin || isModerator;
  const isVolunteer = hasRole("volunteer");

  return { roles, loading, hasRole, isAdmin, isModerator, isVerifiedTrader, isVolunteer };
}
