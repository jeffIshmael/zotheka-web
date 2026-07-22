"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { IdCard, Book, Car, ArrowLeft, ChevronDown, Camera, FileImage, Check } from "lucide-react";
import { MOBILE_MAX_WIDTH } from "@/components/app/MobileShell";

const COUNTRY_CODES = [
  { code: "+265", flag: "🇲🇼", name: "Malawi" },
  { code: "+254", flag: "🇰🇪", name: "Kenya" },
  { code: "+234", flag: "🇳🇬", name: "Nigeria" },
  { code: "+27", flag: "🇿🇦", name: "South Africa" },
  { code: "+250", flag: "🇷🇼", name: "Rwanda" },
  { code: "+255", flag: "🇹🇿", name: "Tanzania" },
  { code: "+256", flag: "🇺🇬", name: "Uganda" },
  { code: "+260", flag: "🇿🇲", name: "Zambia" },
  { code: "+263", flag: "🇿🇼", name: "Zimbabwe" },
  { code: "+1", flag: "🇺🇸", name: "US/Canada" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "+33", flag: "🇫🇷", name: "France" }
];

const NETWORKS = [
  { id: "3b589b9a-65d4-4246-b33a-f095dfc2977d", label: "Airtel Money" },
  { id: "ac522946-3d5d-488e-bf73-583b8d8de908", label: "TNM Mpamba" }
];

export default function KycPage() {
  const router = useRouter();
  const { email } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docDropdownOpen, setDocDropdownOpen] = useState(false);

  const [activeScan, setActiveScan] = useState<'id' | 'selfie' | null>(null);
  const [idScanTab, setIdScanTab] = useState<'front' | 'back'>('front');
  const [showSuccess, setShowSuccess] = useState(false);

  const docTypes = [
    { 
      id: "national_id", 
      label: "National ID Card", 
      icon: <IdCard className="w-5 h-5 text-brand-green" /> 
    },
    { 
      id: "passport", 
      label: "Passport", 
      icon: <Book className="w-5 h-5 text-brand-green" /> 
    },
    { 
      id: "drivers_license", 
      label: "Driver's License", 
      icon: <Car className="w-5 h-5 text-brand-green" /> 
    }
  ];

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneCode: "+265",
    phoneNumber: "",
    network: "3b589b9a-65d4-4246-b33a-f095dfc2977d",
    dateOfBirth: "",
    streetAddress: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    idType: "national_id",
    idNumber: "",
    tosAccepted: false,
  });

  const [images, setImages] = useState<{
    idImageFront: string | null;
    idImageBack: string | null;
    selfieImage: string | null;
  }>({
    idImageFront: null,
    idImageBack: null,
    selfieImage: null,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: keyof typeof images) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => ({ ...prev, [key]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!email) return;

    if (!formData.tosAccepted) {
      setError("You must accept the Terms of Service.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        phoneNumber: `${formData.phoneCode}${formData.phoneNumber.trim().replace(/^(\+?265|0)/, "")}`,
        email
      };

      const res = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to submit KYC");
      }

      setShowSuccess(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    setError(null);
    if (step === 1) {
      if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.phoneNumber) {
        setError("Please fill in all personal details");
        return;
      }
    }
    if (step === 2) {
      if (!formData.idNumber) {
        setError("Please provide your Document Number.");
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setError(null);
    setStep(step - 1);
  };

  const stepLabels = ["Personal Details", "ID Proof"];

  if (showSuccess) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center px-4 bg-background pb-safe">
        <div className="w-full max-w-sm flex flex-col items-center text-center animate-in zoom-in duration-500">
          <div className="w-48 h-64 bg-brand-green-light rounded-[2rem] relative mb-10 flex flex-col items-center justify-center border-4 border-surface shadow-xl">
             <div className="absolute top-4 left-4 font-black text-brand-black/20 text-xl transform -rotate-90">L</div>
             <div className="w-24 h-24 bg-brand-green rounded-full flex items-center justify-center shadow-lg mb-6 z-10 relative">
               <Check className="w-12 h-12 text-white" strokeWidth={3} />
               <div className="absolute inset-0 rounded-full border-4 border-brand-green animate-ping opacity-30"></div>
             </div>
             <h2 className="text-[2.5rem] font-black text-brand-black tracking-tighter">KYC</h2>
          </div>
          <h1 className="text-[2rem] font-black text-brand-black mb-4 tracking-tight">Congratulations</h1>
          <p className="text-muted leading-relaxed mb-12 text-[15px] px-6">
            You have finished setting up your profile and have unlocked these features.
          </p>
        </div>
        
        <div 
          className="fixed bottom-0 left-1/2 p-6 bg-background pb-safe border-t border-border z-40"
          style={{ width: "100%", maxWidth: MOBILE_MAX_WIDTH, transform: "translateX(-50%)" }}
        >
          <button 
            onClick={() => router.push("/app/account")}
            className="w-full rounded-[1.25rem] bg-brand-black text-surface px-8 py-5 text-[17px] font-extrabold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Home
          </button>
        </div>
      </div>
    );
  }

  if (activeScan === 'id') {
    return (
      <div 
        className="fixed top-0 bottom-0 left-1/2 w-full bg-background z-50 flex flex-col animate-in slide-in-from-right-full duration-300"
        style={{ maxWidth: MOBILE_MAX_WIDTH, transform: "translateX(-50%)" }}
      >
         <div className="flex items-center gap-4 p-4 bg-brand-green-light pt-safe">
           <button onClick={() => setActiveScan(null)} className="p-2 bg-surface rounded-[1rem] shadow-sm hover:scale-105 active:scale-95 transition"><ArrowLeft className="w-6 h-6 text-brand-black" /></button>
           <h1 className="font-extrabold text-brand-black text-[17px] tracking-tight">E - KYC Information</h1>
         </div>
         <div className="flex-1 overflow-y-auto p-6 flex flex-col pb-32">
           <div className="relative w-full aspect-[4/3] bg-surface rounded-[2rem] border-2 border-brand-green overflow-hidden mb-8 flex flex-col items-center justify-center shadow-sm">
             {idScanTab === 'front' && images.idImageFront ? (
               <img src={images.idImageFront} className="absolute inset-0 w-full h-full object-cover" />
             ) : idScanTab === 'back' && images.idImageBack ? (
               <img src={images.idImageBack} className="absolute inset-0 w-full h-full object-cover" />
             ) : (
               <div className="w-[85%] h-[75%] border-2 border-dashed border-brand-green/60 rounded-[1rem] relative">
                 <div className="absolute top-1/2 left-0 right-0 border-t-2 border-brand-green/30"></div>
                 <div className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 border-brand-green rounded-tl-lg"></div>
                 <div className="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 border-brand-green rounded-tr-lg"></div>
                 <div className="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 border-brand-green rounded-bl-lg"></div>
                 <div className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 border-brand-green rounded-br-lg"></div>
               </div>
             )}
           </div>

           <div className="flex gap-2 mx-auto mb-10 bg-surface p-1.5 rounded-[1.25rem] border border-border shadow-sm">
             <button onClick={() => setIdScanTab('front')} className={`px-8 py-3.5 rounded-[1rem] text-[15px] font-extrabold flex items-center gap-2 transition-all ${idScanTab === 'front' ? 'bg-brand-green-light text-brand-black shadow-sm' : 'text-muted'}`}><IdCard className="w-5 h-5"/> Front</button>
             <button onClick={() => setIdScanTab('back')} className={`px-8 py-3.5 rounded-[1rem] text-[15px] font-extrabold flex items-center gap-2 transition-all ${idScanTab === 'back' ? 'bg-brand-green-light text-brand-black shadow-sm' : 'text-muted'}`}><IdCard className="w-5 h-5"/> Back</button>
           </div>

           <div className="text-center px-2">
             <h2 className="text-[22px] font-black text-brand-black mb-4 tracking-tight">Scan your {docTypes.find(d => d.id === formData.idType)?.label}: {idScanTab === 'front' ? 'Front' : 'Back'}</h2>
             <p className="text-[15px] text-muted leading-relaxed">Your KYC will automatically be completed using OCR and the information from the registration database. Only the remaining fields need to be checked, edited, and added.</p>
           </div>
         </div>

         <div 
            className="fixed bottom-0 left-1/2 p-6 flex justify-center gap-8 pb-safe bg-gradient-to-t from-background via-background to-transparent pt-12 z-40"
            style={{ width: "100%", maxWidth: MOBILE_MAX_WIDTH, transform: "translateX(-50%)" }}
         >
            <button onClick={() => setImages(prev => ({...prev, [idScanTab === 'front' ? 'idImageFront' : 'idImageBack']: null}))} className="w-16 h-16 rounded-full bg-brand-black flex items-center justify-center text-surface shadow-xl cursor-pointer hover:scale-110 active:scale-95 transition-all">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
            <label className="w-20 h-20 rounded-full bg-brand-green flex items-center justify-center text-surface shadow-xl cursor-pointer hover:scale-110 active:scale-95 transition-all">
               <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileChange(e, idScanTab === 'front' ? 'idImageFront' : 'idImageBack')} />
               <Check className="w-10 h-10" strokeWidth={3} />
            </label>
            <button onClick={() => setActiveScan(null)} className="w-16 h-16 rounded-full bg-brand-black flex items-center justify-center text-surface shadow-xl cursor-pointer hover:scale-110 active:scale-95 transition-all">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
         </div>
      </div>
    )
  }

  if (activeScan === 'selfie') {
    return (
      <div 
        className="fixed top-0 bottom-0 left-1/2 w-full bg-background z-50 flex flex-col animate-in slide-in-from-right-full duration-300"
        style={{ maxWidth: MOBILE_MAX_WIDTH, transform: "translateX(-50%)" }}
      >
         <div className="flex items-center gap-4 p-4 bg-brand-green-light pt-safe">
           <button onClick={() => setActiveScan(null)} className="p-2 bg-surface rounded-[1rem] shadow-sm hover:scale-105 active:scale-95 transition"><ArrowLeft className="w-6 h-6 text-brand-black" /></button>
           <h1 className="font-extrabold text-brand-black text-[17px] tracking-tight">E - KYC Information</h1>
         </div>
         <div className="flex-1 overflow-y-auto p-6 flex flex-col pb-32">
           <div className="relative w-full aspect-[3/4] bg-surface rounded-[2rem] border-2 border-brand-green overflow-hidden mb-10 flex flex-col items-center justify-center shadow-sm">
             {images.selfieImage ? (
               <img src={images.selfieImage} className="absolute inset-0 w-full h-full object-cover" />
             ) : (
               <div className="w-[70%] h-[70%] border-2 border-dashed border-brand-green/60 rounded-[3rem] relative flex items-center justify-center">
                 <Camera className="w-14 h-14 text-brand-green/40" />
                 <div className="absolute top-1/2 left-0 right-0 border-t-2 border-brand-green/30"></div>
                 <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-brand-green rounded-tl-[2rem]"></div>
                 <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-brand-green rounded-tr-[2rem]"></div>
                 <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-brand-green rounded-bl-[2rem]"></div>
                 <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-brand-green rounded-br-[2rem]"></div>
               </div>
             )}
           </div>

           <div className="text-center px-4 mt-4">
             <h2 className="text-[24px] font-black text-brand-black mb-3 tracking-tight">Centre your face</h2>
             <p className="text-[15px] text-muted leading-relaxed">point your face right at the box, then take a photo</p>
           </div>
         </div>

         <div 
            className="fixed bottom-0 left-1/2 p-6 flex justify-center gap-8 pb-safe bg-gradient-to-t from-background via-background to-transparent pt-12 z-40"
            style={{ width: "100%", maxWidth: MOBILE_MAX_WIDTH, transform: "translateX(-50%)" }}
         >
            <button onClick={() => setImages(prev => ({...prev, selfieImage: null}))} className="w-16 h-16 rounded-full bg-brand-black flex items-center justify-center text-surface shadow-xl cursor-pointer hover:scale-110 active:scale-95 transition-all">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
            <label className="w-20 h-20 rounded-full bg-brand-green flex items-center justify-center text-surface shadow-xl cursor-pointer hover:scale-110 active:scale-95 transition-all">
               <input type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => handleFileChange(e, 'selfieImage')} />
               <Check className="w-10 h-10" strokeWidth={3} />
            </label>
            <button onClick={() => setActiveScan(null)} className="w-16 h-16 rounded-full bg-brand-black flex items-center justify-center text-surface shadow-xl cursor-pointer hover:scale-110 active:scale-95 transition-all">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
         </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex-1 px-4 pt-6 pb-[140px] flex flex-col">
        {/* Header & Progress */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <button onClick={() => step > 1 ? prevStep() : router.back()} className="p-2 -ml-2 rounded-full text-brand-black hover:bg-surface transition">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-medium text-brand-black tracking-tight">
              Setup profile
            </h1>
          </div>
          
          <div className="flex w-full gap-2">
            {stepLabels.map((label, index) => {
              const isCompletedOrActive = step >= index + 1;
              return (
                <div key={label} className="flex-1 flex flex-col gap-1.5">
                  <span className={`text-[11px] font-medium text-center whitespace-nowrap overflow-hidden text-ellipsis ${isCompletedOrActive ? 'text-brand-green' : 'text-muted/40'}`}>
                    {label}
                  </span>
                  <div className={`h-1.5 w-full rounded-full transition-colors ${isCompletedOrActive ? 'bg-brand-green' : 'bg-border/60'}`} />
                </div>
              )
            })}
          </div>
        </div>

        {error && <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-semibold">{error}</div>}

        <div className="flex-1 space-y-5">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-muted">First Name <span className="text-red-500 ml-0.5">*</span></label>
                  <input required type="text" className="w-full rounded-2xl bg-surface border-none p-4 text-sm text-brand-black shadow-sm placeholder-muted focus:ring-2 focus:ring-brand-green outline-none transition" 
                         placeholder="John"
                         value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-muted">Last Name <span className="text-red-500 ml-0.5">*</span></label>
                  <input required type="text" className="w-full rounded-2xl bg-surface border-none p-4 text-sm text-brand-black shadow-sm placeholder-muted focus:ring-2 focus:ring-brand-green outline-none transition" 
                         placeholder="Doe"
                         value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-muted">Phone Number <span className="text-red-500 ml-0.5">*</span></label>
                <div className="flex bg-surface rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-brand-green transition overflow-hidden">
                  <select 
                    className="bg-transparent border-none pl-4 pr-2 py-4 text-sm text-brand-black focus:ring-0 outline-none cursor-pointer"
                    value={formData.phoneCode}
                    onChange={(e) => setFormData({...formData, phoneCode: e.target.value})}
                  >
                    {COUNTRY_CODES.map(country => (
                      <option key={country.name} value={country.code}>{country.flag} {country.code}</option>
                    ))}
                  </select>
                  <div className="w-[1px] bg-border my-3" />
                  <input required type="tel" className="flex-1 bg-transparent border-none p-4 text-sm text-brand-black placeholder-muted focus:ring-0 outline-none" 
                         placeholder="234 567 8900"
                         value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-muted">Mobile Network <span className="text-red-500 ml-0.5">*</span></label>
                <div className="relative">
                  <select 
                    className="w-full appearance-none rounded-2xl bg-surface border-none p-4 pr-10 text-sm text-brand-black shadow-sm placeholder-muted focus:ring-2 focus:ring-brand-green outline-none transition cursor-pointer"
                    value={formData.network}
                    onChange={(e) => setFormData({...formData, network: e.target.value})}
                  >
                    {NETWORKS.map(net => (
                      <option key={net.id} value={net.id}>{net.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-muted">Date of Birth <span className="text-red-500 ml-0.5">*</span></label>
                <input required type="date" className="w-full rounded-2xl bg-surface border-none p-4 text-sm text-brand-black shadow-sm placeholder-muted focus:ring-2 focus:ring-brand-green outline-none transition" 
                       value={formData.dateOfBirth} onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
              <div className="relative">
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-muted">Document Type <span className="text-red-500 ml-0.5">*</span></label>
                <div 
                  onClick={() => setDocDropdownOpen(!docDropdownOpen)}
                  className="flex items-center justify-between w-full rounded-2xl bg-surface p-4 text-sm text-brand-black shadow-sm cursor-pointer border border-transparent focus-within:ring-2 focus-within:ring-brand-green transition"
                >
                  <div className="flex items-center gap-3">
                    {docTypes.find(d => d.id === formData.idType)?.icon}
                    <span className="font-medium">{docTypes.find(d => d.id === formData.idType)?.label}</span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-muted transition-transform ${docDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
                {docDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-surface rounded-2xl shadow-card border border-border z-10 overflow-hidden">
                    {docTypes.map(doc => (
                      <div 
                        key={doc.id}
                        onClick={() => { setFormData({...formData, idType: doc.id}); setDocDropdownOpen(false); }}
                        className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-background transition ${formData.idType === doc.id ? 'bg-brand-green-light' : ''}`}
                      >
                        {doc.icon}
                        <span className="font-medium text-[15px] text-brand-black">{doc.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-muted">Document Number <span className="text-red-500 ml-0.5">*</span></label>
                <input required type="text" className="w-full rounded-2xl bg-surface border-none p-4 text-sm text-brand-black shadow-sm placeholder-muted focus:ring-2 focus:ring-brand-green outline-none transition" 
                       placeholder="e.g. A12345678"
                       value={formData.idNumber} onChange={(e) => setFormData({...formData, idNumber: e.target.value})} />
              </div>

              <hr className="my-8 border-border" />

              {/* Tasks List */}
              <div className="mt-8 space-y-4">
                <div 
                  className="relative flex items-center justify-between p-4 rounded-2xl border bg-surface border-brand-green/30 opacity-70 pointer-events-none"
                >
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] rounded-2xl z-10 flex items-center justify-center">
                    <span className="bg-brand-black text-surface text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">Coming Soon</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-green-light flex items-center justify-center text-brand-green">
                      <IdCard className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-extrabold text-brand-black tracking-tight">Scan your {docTypes.find(d => d.id === formData.idType)?.label}*</h4>
                      <p className="text-[13px] text-muted">It should be updated</p>
                    </div>
                  </div>
                  {images.idImageFront && images.idImageBack ? (
                    <div className="w-6 h-6 rounded-full bg-brand-green flex items-center justify-center">
                      <Check className="w-4 h-4 text-surface" strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-muted/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-surface" strokeWidth={3} />
                    </div>
                  )}
                </div>

                <div 
                  className="relative flex items-center justify-between p-4 rounded-2xl border bg-surface border-brand-green/30 opacity-70 pointer-events-none"
                >
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] rounded-2xl z-10 flex items-center justify-center">
                    <span className="bg-brand-black text-surface text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">Coming Soon</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-green-light flex items-center justify-center text-brand-green">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-extrabold text-brand-black tracking-tight">Take a Selfie*</h4>
                      <p className="text-[13px] text-muted">Background should be clean</p>
                    </div>
                  </div>
                  {images.selfieImage ? (
                    <div className="w-6 h-6 rounded-full bg-brand-green flex items-center justify-center">
                      <Check className="w-4 h-4 text-surface" strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-muted/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-surface" strokeWidth={3} />
                    </div>
                  )}
                </div>
              </div>

              <label className="flex items-start gap-3 p-4 mt-6 rounded-2xl bg-surface border border-border shadow-sm cursor-pointer hover:bg-surface/80 transition">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input 
                    type="checkbox" 
                    className="peer appearance-none w-5 h-5 border-2 border-muted rounded-md checked:bg-brand-green checked:border-brand-green transition"
                    checked={formData.tosAccepted}
                    onChange={(e) => setFormData({...formData, tosAccepted: e.target.checked})}
                  />
                  <Check className="absolute w-3.5 h-3.5 text-surface pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
                </div>
                <p className="text-[13px] text-muted leading-snug">
                  I agree to the <span className="text-brand-green font-medium">Terms of Service</span> and <span className="text-brand-green font-medium">Privacy Policy</span>. I confirm all provided details are accurate.
                </p>
              </label>

            </div>
          )}
        </div>
      </div>

      {/* Footer / CTA - Fixed Bottom */}
      <div 
        className="fixed bottom-0 left-1/2 p-6 bg-background pb-safe border-t border-border z-40"
        style={{ width: "100%", maxWidth: MOBILE_MAX_WIDTH, transform: "translateX(-50%)" }}
      >
        <div className="flex gap-4">
          {step > 1 && (
            <button 
              type="button" 
              onClick={prevStep}
              className="w-1/3 rounded-[1.25rem] bg-surface border-2 border-border text-brand-black px-4 py-5 text-[17px] font-extrabold shadow-sm active:scale-[0.98] transition-transform hover:bg-surface/50"
            >
              Back
            </button>
          )}
          {step < 2 ? (
            <button 
              type="button"
              onClick={nextStep}
              disabled={!formData.firstName || !formData.lastName || !formData.phoneNumber || !formData.dateOfBirth}
              className="flex-1 rounded-[1.25rem] bg-brand-green text-surface px-8 py-5 text-[17px] font-extrabold shadow-md hover:bg-brand-green-dark active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
            >
              Next
            </button>
          ) : (
            <button 
              type="button" 
              onClick={handleSubmit}
              disabled={loading || !formData.tosAccepted || !formData.idNumber}
              className="flex-1 rounded-[1.25rem] bg-brand-black text-surface px-8 py-5 text-[17px] font-extrabold shadow-lg disabled:opacity-50 disabled:shadow-none hover:bg-black active:scale-[0.98] transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 rounded-full border-2 border-surface/30 border-t-surface animate-spin" />
                  Verifying...
                </span>
              ) : "Done"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
