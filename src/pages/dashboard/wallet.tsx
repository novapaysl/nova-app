const handleDepositRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) return alert("Please enter a valid amount");
    if (!phoneNumber) return alert("Please enter your mobile money number");

    setDepositLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const response = await fetch("/api/deposit", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(amt * 100), // SLE to minor units (cents)
          provider: depositMethod === "Orange Money" ? "orange" : "afrimoney",
          phoneNumber: phoneNumber
        })
      });

      const paymentData = await response.json();

      if (!response.ok) {
        const errorText = typeof paymentData.error === "object" 
          ? JSON.stringify(paymentData.error) 
          : (paymentData.error || "Backend failed to process request");
        throw new Error(errorText);
      }

      // Record transaction to Supabase
      const { error } = await supabase
        .from("deposits")
        .insert([{
          user_id: user.id,
          amount: amt,
          currency: "SLE",
          payment_method: depositMethod,
          status: "processing" 
        }]);

      if (error) throw error;
      
      alert("✅ Payment requested! Check your phone for the mobile money pin prompt.");
      setShowDepositModal(false);
      setDepositAmount("");
      setPhoneNumber("");
    } catch (err: any) {
      const displayMsg = typeof err.message === "string" ? err.message : JSON.stringify(err);
      alert(`Deposit Failed: ${displayMsg}`);
    } finally {
      setDepositLoading(false);
    }
  };