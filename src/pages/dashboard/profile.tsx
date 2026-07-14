import { useGetIdentity, useOne } from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import { User, Mail, Phone, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Identity = {
  id: string;
  name?: string;
  email?: string;
};

type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  avatar_url?: string;
  account_status?: string;
};

function getInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.trim()[0].toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return "U";
}

function AccountStatusBadge({ status }: { status?: string }) {
  const s = (status ?? "").toLowerCase();

  if (s === "approved" || s === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700 border border-green-200">
        <CheckCircle size={14} />
        {status?.charAt(0).toUpperCase()}
        {status?.slice(1)}
      </span>
    );
  }
  if (s === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-700 border border-amber-200">
        <Clock size={14} />
        Pending
      </span>
    );
  }
  if (s === "suspended") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700 border border-red-200">
        <AlertTriangle size={14} />
        Suspended
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-600 border border-gray-200">
      {status ?? "Unknown"}
    </span>
  );
}

export const ProfilePage = () => {
  const { data: identity, isLoading: identityLoading } = useGetIdentity<Identity>();
  const userId = identity?.id;

  // Fetch profile data for display (avatar, status)
  const { query: profileQuery, result: profileResult } = useOne<Profile>({
    resource: "profiles",
    id: userId ?? "",
    queryOptions: { enabled: !!userId },
  });
  const profileLoading = profileQuery.isLoading;
  const profile = profileResult ?? profileQuery?.data?.data;

  // useForm for editing
  const {
    refineCore: { onFinish, formLoading, query: formQuery },
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Profile>({
    refineCoreProps: {
      resource: "profiles",
      action: "edit",
      id: userId,
      queryOptions: { enabled: !!userId },
      onMutationSuccess: () => {
        toast.success("Profile updated successfully", {
          description: "Your profile information has been saved.",
        });
      },
    },
  });

  const isLoading = identityLoading || profileLoading || formQuery?.isLoading;

  const displayName = profile?.full_name ?? identity?.name ?? "";
  const displayEmail = profile?.email ?? identity?.email ?? "";
  const initials = getInitials(displayName, displayEmail);
  const accountStatus = profile?.account_status;

  function onSubmit(values: Partial<Profile>) {
    // Don't submit email — it's read-only
    const { email: _email, ...rest } = values as Profile;
    onFinish(rest);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Heading */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#EFF6FF" }}>
          <User className="h-5 w-5" style={{ color: "#1DA1F2" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
            My Profile
          </h1>
          <p className="text-sm text-gray-500">Manage your personal information</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Gradient banner */}
        <div className="h-24 w-full" style={{ background: "linear-gradient(135deg, #1DA1F2 0%, #22C55E 100%)" }} />

        {/* Avatar + Info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col items-center -mt-10 mb-4">
            {/* Avatar */}
            <div
              className="h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg border-4 border-white"
              style={{ backgroundColor: "#1DA1F2" }}>
              {isLoading ? <Skeleton className="h-20 w-20 rounded-full" /> : initials}
            </div>

            {/* Change Photo button */}
            <button
              type="button"
              onClick={() => toast("Coming soon!", { description: "Photo upload feature will be available soon." })}
              className="mt-3 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
              Change Photo
            </button>
          </div>

          {/* Name / Email / Phone */}
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-52" />
              <Skeleton className="h-4 w-32" />
            </div>
          ) : (
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
                {displayName || "—"}
              </h2>
              <p className="text-sm text-gray-500 flex items-center justify-center gap-1.5">
                <Mail size={13} />
                {displayEmail || "—"}
              </p>
              {profile?.phone_number && (
                <p className="text-sm text-gray-500 flex items-center justify-center gap-1.5">
                  <Phone size={13} />
                  {profile.phone_number}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-bold text-gray-900 mb-5" style={{ fontFamily: "Poppins, sans-serif" }}>
          Edit Profile
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="full_name" className="text-sm font-medium text-gray-700">
              Full Name
            </Label>
            <Input
              id="full_name"
              placeholder="Enter your full name"
              className="h-10 rounded-lg border-gray-200 focus:border-[#1DA1F2] focus:ring-[#1DA1F2]"
              {...register("full_name", { required: "Full name is required" })}
            />
            {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message as string}</p>}
          </div>

          {/* Email — read only */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              disabled
              className="h-10 rounded-lg border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
              {...register("email")}
            />
            <p className="text-xs text-gray-400">Contact support to change your email address.</p>
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <Label htmlFor="phone_number" className="text-sm font-medium text-gray-700">
              Phone Number
            </Label>
            <Input
              id="phone_number"
              type="tel"
              placeholder="+232 XX XXX XXXX"
              className="h-10 rounded-lg border-gray-200 focus:border-[#1DA1F2] focus:ring-[#1DA1F2]"
              {...register("phone_number")}
            />
            {errors.phone_number && <p className="text-xs text-red-500">{errors.phone_number.message as string}</p>}
          </div>

          {/* Save Button */}
          <Button
            type="submit"
            disabled={formLoading || isLoading}
            className="w-full h-11 text-sm font-semibold rounded-xl text-white transition-all duration-200 hover:opacity-90"
            style={{ backgroundColor: "#1DA1F2" }}>
            {formLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving…
              </span>
            ) : (
              "Save Changes"
            )}
          </Button>
        </form>
      </div>

      {/* Account Status Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-bold text-gray-900 mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
          Account Status
        </h3>

        {isLoading ? (
          <Skeleton className="h-8 w-28 rounded-full" />
        ) : (
          <div className="space-y-4">
            <AccountStatusBadge status={accountStatus} />

            {(accountStatus?.toLowerCase() === "pending" || !accountStatus) && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 mb-1">KYC Verification Pending</p>
                  <p className="text-sm text-amber-700">
                    Your KYC verification is under review. Complete verification to unlock all features.
                  </p>
                  <Link
                    to="/kyc"
                    className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-amber-800 hover:text-amber-900 underline underline-offset-2">
                    Complete KYC →
                  </Link>
                </div>
              </div>
            )}

            {accountStatus?.toLowerCase() === "suspended" && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800 mb-1">Account Suspended</p>
                  <p className="text-sm text-red-700">
                    Your account has been suspended. Please contact NovaPay support for assistance.
                  </p>
                </div>
              </div>
            )}

            {(accountStatus?.toLowerCase() === "approved" || accountStatus?.toLowerCase() === "active") && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-800 mb-1">Account Verified</p>
                  <p className="text-sm text-green-700">
                    Your identity has been verified. You have full access to all NovaPay features.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
