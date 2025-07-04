"use client";

import React, { useState, useRef, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { useRouter } from "next/navigation";
import { useEdgeStore } from "@/components/EdgeStoreProvider";
import { useAppContext } from "@/src/context/AppContext";
import Image from "next/image";

interface Attribute {
  trait: string;
  value: string;
}

interface CollectionData {
  name: string;
  description: string;
  collectionType: "homogeneous" | "heterogeneous";
  assets: File[];
  collectionPreviewImage: File | null;
  existingCollection: string;
  createNewCollection: boolean;
  royalty: string;
  floorPrice: string;
  assetType: string;
}

interface NFTData {
  name: string;
  description: string;
  asset: File | null;
  previewImage: File | null;
  attributes: Attribute[];
  price: string;
  royalty: string;
  collectionOption: "none" | "existing";
  existingCollection: string;
}

const CreatePage = () => {
  const { account, connectWallet } = useWallet();
  const router = useRouter();
  const { edgestore } = useEdgeStore();
  const [activeTab, setActiveTab] = useState<"single" | "collection">("single");
  const [step, setStep] = useState(1);
  const { isLoading, setLoading, showNotification } = useAppContext();
  const [assetType, setAssetType] = useState("image");
  const [nftData, setNftData] = useState<NFTData>({
    name: "",
    description: "",
    asset: null,
    previewImage: null,
    attributes: [{ trait: "", value: "" }],
    price: "",
    royalty: "5",
    collectionOption: "none",
    existingCollection: "",
  });
  const [collectionData, setCollectionData] = useState<CollectionData>({
    name: "",
    description: "",
    collectionType: "homogeneous",
    assets: [],
    collectionPreviewImage: null,
    existingCollection: "",
    createNewCollection: true,
    royalty: "5",
    floorPrice: "",
    assetType: "image",
  });
  const [previewUrl, setPreviewUrl] = useState("");
  const [collectionPreviewUrls, setCollectionPreviewUrls] = useState<string[]>([]);
  const [existingCollections, setExistingCollections] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [commonAttributes, setCommonAttributes] = useState<Attribute[]>([{ trait: "", value: "" }]);
  const [uniqueAttributes, setUniqueAttributes] = useState<Attribute[][]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewInputRef = useRef<HTMLInputElement>(null);
  const collectionFileInputRef = useRef<HTMLInputElement>(null);
  const collectionPreviewInputRef = useRef<HTMLInputElement>(null);
  const collectionMainPreviewInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch(`/api/collections/owned?creator=${account}`);
        const result = await response.json();
        if (result.success) {
          setExistingCollections(result.collections);
        } else {
          showNotification(result.error || 'Failed to load collections', 'error');
        }
      } catch (error) {
        console.error('Failed to fetch collections:', error);
        showNotification('Failed to load collections', 'error');
      }
    };

    if (account) {
      fetchCollections();
    }
  }, [account]);

  useEffect(() => {
    if (activeTab === 'collection') {
      setUniqueAttributes(collectionData.assets.map(() => []));
    }
  }, [collectionData.assets, activeTab]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isPreview = false,
    isCollectionPreview = false
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (activeTab === "single") {
        if (isPreview) {
          setNftData({ ...nftData, previewImage: file });
          setPreviewUrl(URL.createObjectURL(file));
        } else {
          setNftData({ ...nftData, asset: file });

          if (assetType !== "image" && !nftData.previewImage) {
            setTimeout(() => {
              previewInputRef.current?.click();
            }, 300);
          }
        }
      } else {
        const files = Array.from(e.target.files);
        if (isCollectionPreview) {
          setCollectionData({
            ...collectionData,
            collectionPreviewImage: file,
          });
          setPreviewUrl(URL.createObjectURL(file));
        } else if (isPreview) {
          setCollectionData({
            ...collectionData,
          });
          setCollectionPreviewUrls([
            ...collectionPreviewUrls,
            ...files.map((file) => URL.createObjectURL(file)),
          ]);
        } else {
          setCollectionData({
            ...collectionData,
            assets: [...collectionData.assets, ...files],
          });

          setTimeout(() => {
            collectionPreviewInputRef.current?.click();
          }, 300);
        }
      }
    }
  };

  const handleAttributeChange = (index: number, field: string, value: string) => {
    const attributes = [...nftData.attributes];
    attributes[index] = { ...attributes[index], [field]: value };
    setNftData({ ...nftData, attributes });
  };

  const handleCommonAttributeChange = (index: number, field: string, value: string) => {
    const attributes = [...commonAttributes];
    attributes[index] = { ...attributes[index], [field]: value };
    setCommonAttributes(attributes);
  };

  const handleUniqueAttributeChange = (nftIndex: number, attrIndex: number, field: string, value: string) => {
    const newUniqueAttributes = [...uniqueAttributes];
    if (!newUniqueAttributes[nftIndex]) newUniqueAttributes[nftIndex] = [];
    newUniqueAttributes[nftIndex][attrIndex] = { 
      ...newUniqueAttributes[nftIndex][attrIndex], 
      [field]: value 
    };
    setUniqueAttributes(newUniqueAttributes);
  };

  const addAttribute = () => {
    const lastAttribute = nftData.attributes[nftData.attributes.length - 1];
    if (lastAttribute.trait.trim() === "" || lastAttribute.value.trim() === "") {
      showNotification("Please fill current attribute before adding new one", "error");
      return;
    }
    setNftData({
      ...nftData,
      attributes: [...nftData.attributes, { trait: "", value: "" }],
    });
  };

  const addCommonAttribute = () => {
    const lastAttribute = commonAttributes[commonAttributes.length - 1];
    if (lastAttribute.trait.trim() === "" || lastAttribute.value.trim() === "") {
      showNotification("Please complete current attribute before adding new one", "error");
      return;
    }
    setCommonAttributes([...commonAttributes, { trait: "", value: "" }]);
  };

  const addUniqueAttribute = (nftIndex: number) => {
    const lastAttribute = uniqueAttributes[nftIndex]?.[uniqueAttributes[nftIndex].length - 1];
    if (lastAttribute && (lastAttribute.trait.trim() === "" || lastAttribute.value.trim() === "")) {
      showNotification("Please complete current attribute before adding new one", "error");
      return;
    }
    const newUniqueAttributes = [...uniqueAttributes];
    if (!newUniqueAttributes[nftIndex]) newUniqueAttributes[nftIndex] = [];
    newUniqueAttributes[nftIndex].push({ trait: "", value: "" });
    setUniqueAttributes(newUniqueAttributes);
  };

  const removeAttribute = (index: number) => {
    if (nftData.attributes.length <= 1) {
      showNotification("You must have at least one attribute", "error");
      return;
    }

    const attributes = [...nftData.attributes];
    attributes.splice(index, 1);
    setNftData({
      ...nftData,
      attributes: attributes.length > 0 ? attributes : [{ trait: "", value: "" }],
    });
  };

  const cleanAttributes = (attributes: Attribute[]) => {
    return attributes.filter(
      (attr) => attr.trait.trim() !== "" && attr.value.trim() !== ""
    );
  };

  const validateForm = () => {
    if (activeTab === "single") {
      if (!nftData.name) {
        showNotification("NFT name is required", "error");
        return false;
      }
      if (!nftData.asset) {
        showNotification("Asset file is required", "error");
        return false;
      }
      if (assetType !== "image" && !nftData.previewImage) {
        showNotification("Preview image is required for this asset type", "error");
        return false;
      }
      if (nftData.collectionOption === "existing" && !nftData.existingCollection) {
        showNotification("Please select a collection", "error");
        return false;
      }

      const hasIncompleteAttributes = nftData.attributes.some(
        (attr) =>
          (attr.trait.trim() === "" && attr.value.trim() !== "") ||
          (attr.value.trim() === "" && attr.trait.trim() !== "")
      );
      if (hasIncompleteAttributes) {
        showNotification("Please complete all attribute fields", "error");
        return false;
      }
    } else {
      if (!collectionData.name) {
        showNotification("Collection name is required", "error");
        return false;
      }
      if (collectionData.assets.length === 0) {
        showNotification("At least one asset is required", "error");
        return false;
      }
      if (!collectionData.collectionPreviewImage) {
        showNotification("Collection preview image is required", "error");
        return false;
      }
      if (!collectionData.floorPrice) {
        showNotification("Floor price is required", "error");
        return false;
      }
      if (!collectionData.createNewCollection && !collectionData.existingCollection) {
        showNotification("Please select an existing collection", "error");
        return false;
      }
    }
    return true;
  };

  const uploadWithRetry = async (file: File, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await edgestore._0gNft.upload({
          file,
          options: { temporary: false },
          onProgressChange: (progress) => setUploadProgress(progress),
        });
        return res.url;
      } catch (error) {
        console.error(`Upload attempt ${i + 1} failed:`, error);
        if (i === retries - 1) {
          showNotification("File upload failed. Please try again.", "error");
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!navigator.onLine) {
      showNotification("No internet connection. Please check your network.", "error");
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      await connectWallet();
      let assetUrl = "";
      let previewUrl = "";
      const collectionAssetUrls: { url: string; type: string }[] = [];
      const collectionPreviewUrls: string[] = [];
      let collectionMainPreviewUrl = "";

      if (activeTab === "single") {
        if (nftData.asset) {
          assetUrl = await uploadWithRetry(nftData.asset);
        }

        if (nftData.previewImage) {
          previewUrl = await uploadWithRetry(nftData.previewImage);
        }
      } else {
        for (const asset of collectionData.assets) {
          const url = await uploadWithRetry(asset);
          collectionAssetUrls.push({
            url,
            type: collectionData.collectionType === "homogeneous"
              ? collectionData.assetType
              : asset.name.split(".").pop()?.toLowerCase() || "other",
          });
        }

        if (collectionData.collectionPreviewImage) {
          collectionMainPreviewUrl = await uploadWithRetry(collectionData.collectionPreviewImage);
        }
      }

      const creationData = {
        type: activeTab,
        data: {
          ...(activeTab === "single"
            ? {
                nftData: {
                  ...nftData,
                  assetUrl,
                  previewUrl,
                  assetType,
                  attributes: cleanAttributes(nftData.attributes),
                  collectionId: nftData.collectionOption === "existing"
                    ? nftData.existingCollection
                    : null,
                },
              }
            : {
                collectionData: {
                  ...collectionData,
                  assets: collectionAssetUrls,
                  previewUrls: collectionPreviewUrls,
                  collectionPreviewUrl: collectionMainPreviewUrl,
                  assetType,
                  royalty: collectionData.royalty,
                  floorPrice: collectionData.floorPrice,
                  collectionId: collectionData.createNewCollection
                    ? null
                    : collectionData.existingCollection,
                  commonAttributes: cleanAttributes(commonAttributes),
                  uniqueAttributes: uniqueAttributes.map(attrs => cleanAttributes(attrs))
                },
              }),
        },
        creator: account,
      };

      const response = await fetch("/api/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(creationData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to create");
      }

      showNotification(
        activeTab === "single"
          ? "NFT created successfully!"
          : "Collection created successfully!",
        "success"
      );
      router.push("/profile");
    } catch (error) {
      console.error("Creation error:", error);
      showNotification("Failed to create. Please try again.", "error");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const renderAssetPreview = () => {
    if (!nftData.asset) return null;

    if (assetType === "image") {
      return (
        <div className="h-64 w-full bg-gray-800/50 rounded-xl flex items-center justify-center overflow-hidden">
          <Image
            src={URL.createObjectURL(nftData.asset)}
            alt="NFT preview"
            className="max-h-full max-w-full object-contain"
          />
        </div>
      );
    }

    if (assetType === "video") {
      return (
        <div className="h-64 w-full bg-gray-800/50 rounded-xl flex items-center justify-center overflow-hidden">
          <video
            src={URL.createObjectURL(nftData.asset)}
            controls
            className="max-h-full max-w-full"
          />
        </div>
      );
    }

    if (assetType === "audio") {
      return (
        <div className="h-64 w-full bg-gray-800/50 rounded-xl flex items-center justify-center overflow-hidden">
          <div className="text-center p-4">
            <div className="text-cyan-400 text-5xl mb-4">
              <i className="fas fa-music"></i>
            </div>
            <p className="text-gray-300 mb-4">{nftData.asset.name}</p>
            <audio
              src={URL.createObjectURL(nftData.asset)}
              controls
              className="w-full"
            />
          </div>
        </div>
      );
    }

    if (assetType === "3d") {
      return (
        <div className="h-64 w-full bg-gray-800/50 rounded-xl flex flex-col items-center justify-center overflow-hidden">
          <div className="text-cyan-400 text-5xl mb-4">
            <i className="fas fa-cube"></i>
          </div>
          <p className="text-gray-300 mb-4">{nftData.asset.name}</p>
          <p className="text-gray-500 text-sm">
            3D preview will be interactive in production
          </p>
        </div>
      );
    }

    return null;
  };

  const renderCollectionPreview = () => {
    if (collectionData.assets.length === 0) return null;

    if (collectionData.collectionType === "homogeneous") {
      return (
        <div className="grid grid-cols-3 gap-4">
          {collectionData.assets.map((asset, index) => (
            <div
              key={index}
              className="bg-gray-800/50 rounded-lg overflow-hidden"
            >
              {collectionData.assets[index] ? (
                <Image
                  src={URL.createObjectURL(collectionData.assets[index])}
                  alt={`Asset ${index + 1}`}
                  className="h-32 w-full object-cover"
                />
              ) : (
                <div className="h-32 flex items-center justify-center bg-gray-900/50">
                  <div className="text-cyan-400 text-2xl">
                    {assetType === "video" && <i className="fas fa-video"></i>}
                    {assetType === "audio" && <i className="fas fa-music"></i>}
                    {assetType === "3d" && <i className="fas fa-cube"></i>}
                  </div>
                </div>
              )}
              <div className="p-2 text-xs">
                <p className="truncate">{asset.name}</p>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-4">
        {collectionData.assets.map((asset, index) => {
          const extension = asset.name.split(".").pop()?.toLowerCase();
          let assetType = "other";

          if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || ""))
            assetType = "image";
          if (["mp4", "mov", "avi", "webm"].includes(extension || ""))
            assetType = "video";
          if (["mp3", "wav", "ogg"].includes(extension || ""))
            assetType = "audio";
          if (["glb", "gltf", "obj", "stl"].includes(extension || ""))
            assetType = "3d";

          return (
            <div
              key={index}
              className="bg-gray-800/50 rounded-lg overflow-hidden"
            >
              {collectionPreviewUrls[index] ? (
                <Image
                  src={collectionPreviewUrls[index]}
                  alt={`Preview ${index + 1}`}
                  className="h-32 w-full object-cover"
                />
              ) : (
                <div className="h-32 flex items-center justify-center bg-gray-900/50">
                  <div className="text-cyan-400 text-2xl">
                    {assetType === "image" && <i className="fas fa-image"></i>}
                    {assetType === "video" && <i className="fas fa-video"></i>}
                    {assetType === "audio" && <i className="fas fa-music"></i>}
                    {assetType === "3d" && <i className="fas fa-cube"></i>}
                    {assetType === "other" && <i className="fas fa-file"></i>}
                  </div>
                </div>
              )}
              <div className="p-2 text-xs">
                <p className="truncate">{asset.name}</p>
                <p className="text-gray-500 capitalize">{assetType}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Select Creation Type</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setActiveTab("single")}
                className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                  activeTab === "single"
                    ? "border-cyan-500 bg-cyan-900/20"
                    : "border-gray-700 hover:border-cyan-400"
                }`}
              >
                <div className="text-cyan-400 text-3xl mb-3">
                  <i className="fas fa-cube"></i>
                </div>
                <h4 className="font-bold text-lg">Single NFT</h4>
                <p className="text-gray-400 mt-2">
                  Create a unique digital asset
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("collection")}
                className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                  activeTab === "collection"
                    ? "border-cyan-500 bg-cyan-900/20"
                    : "border-gray-700 hover:border-cyan-400"
                }`}
              >
                <div className="text-cyan-400 text-3xl mb-3">
                  <i className="fas fa-layer-group"></i>
                </div>
                <h4 className="font-bold text-lg">NFT Collection</h4>
                <p className="text-gray-400 mt-2">
                  Create multiple related NFTs
                </p>
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-8">
          {activeTab === "single" ? (
            <>
              <div>
                <h3 className="text-xl font-bold mb-4">Select Asset Type</h3>
                <div className="grid grid-cols-5 gap-4">
                  {["image", "video", "audio", "3d"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAssetType(type)}
                      className={`p-4 rounded-xl border transition-all duration-300 ${
                        assetType === type
                          ? "border-cyan-500 bg-cyan-900/20"
                          : "border-gray-700 hover:border-cyan-400"
                      }`}
                    >
                      <div className="text-cyan-400 text-xl mb-2">
                        {type === "image" && <i className="fas fa-image"></i>}
                        {type === "video" && <i className="fas fa-video"></i>}
                        {type === "audio" && <i className="fas fa-music"></i>}
                        {type === "3d" && <i className="fas fa-cube"></i>}
                      </div>
                      <span className="capitalize">{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold mb-4">Upload Asset</h3>
                  <div
                    className="bg-gray-900/50 border-2 border-dashed border-cyan-900/30 rounded-xl p-8 text-center cursor-pointer hover:border-cyan-500 transition-colors duration-300"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="text-cyan-400 text-4xl mb-4">
                      <i className="fas fa-cloud-upload-alt"></i>
                    </div>
                    <p className="font-medium">
                      Click to upload your {assetType} file
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      {assetType === "image" && "JPG, PNG, GIF - Max 50MB"}
                      {assetType === "video" && "MP4, MOV - Max 200MB"}
                      {assetType === "audio" && "MP3, WAV - Max 50MB"}
                      {assetType === "3d" && "GLB, GLTF, OBJ, STL - Max 100MB"}
                    </p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => handleFileChange(e)}
                      className="hidden"
                      accept={
                        assetType === "image"
                          ? "image/*"
                          : assetType === "video"
                          ? "video/*"
                          : assetType === "audio"
                          ? "audio/*"
                          : assetType === "3d"
                          ? ".glb,.gltf,.obj,.stl"
                          : "*"
                      }
                    />
                  </div>

                  {nftData.asset && (
                    <div className="mt-4 bg-gray-900/30 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="text-cyan-400 mr-3">
                          <i className="fas fa-file"></i>
                        </div>
                        <div>
                          <p className="text-sm truncate max-w-xs">
                            {nftData.asset.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(nftData.asset.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNftData({ ...nftData, asset: null })}
                        className="text-red-500 hover:text-red-400"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  )}

                  {assetType !== "image" && nftData.asset && (
                    <div className="mt-6">
                      <h3 className="text-xl font-bold mb-4">
                        Upload Preview Image
                      </h3>
                      <div
                        className="bg-gray-900/50 border-2 border-dashed border-cyan-900/30 rounded-xl p-8 text-center cursor-pointer hover:border-cyan-500 transition-colors duration-300"
                        onClick={() => previewInputRef.current?.click()}
                      >
                        <div className="text-cyan-400 text-4xl mb-4">
                          <i className="fas fa-image"></i>
                        </div>
                        <p className="font-medium">
                          Click to upload a preview image
                        </p>
                        <p className="text-gray-500 text-sm mt-2">
                          JPG, PNG - Max 10MB
                        </p>
                        <input
                          type="file"
                          ref={previewInputRef}
                          onChange={(e) => handleFileChange(e, true)}
                          className="hidden"
                          accept="image/*"
                        />
                      </div>

                      {nftData.previewImage && (
                        <div className="mt-4 bg-gray-900/30 rounded-lg p-3 flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="text-cyan-400 mr-3">
                              <i className="fas fa-image"></i>
                            </div>
                            <div>
                              <p className="text-sm">
                                {nftData.previewImage.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(
                                  nftData.previewImage.size /
                                  1024 /
                                  1024
                                ).toFixed(2)}{" "}
                                MB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setNftData({ ...nftData, previewImage: null });
                              setPreviewUrl("");
                            }}
                            className="text-red-500 hover:text-red-400"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-4">Preview</h3>
                  {renderAssetPreview()}

                  {assetType === "3d" && nftData.asset && (
                    <div className="mt-6">
                      <h3 className="text-xl font-bold mb-4">3D Controls</h3>
                      <div className="grid grid-cols-3 gap-2">
                        <button className="bg-gray-800/50 p-3 rounded-lg hover:bg-gray-700 transition-colors">
                          <i className="fas fa-rotate"></i> Rotate
                        </button>
                        <button className="bg-gray-800/50 p-3 rounded-lg hover:bg-gray-700 transition-colors">
                          <i className="fas fa-arrows-alt"></i> Pan
                        </button>
                        <button className="bg-gray-800/50 p-3 rounded-lg hover:bg-gray-700 transition-colors">
                          <i className="fas fa-search-plus"></i> Zoom
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {collectionData.collectionType === "homogeneous" && (
                <div>
                  <h3 className="text-xl font-bold mb-4">Select Asset Type</h3>
                  <div className="grid grid-cols-5 gap-4">
                    {["image", "video", "audio", "3d"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setAssetType(type);
                          setCollectionData({
                            ...collectionData,
                            assetType: type,
                          });
                        }}
                        className={`p-4 rounded-xl border transition-all duration-300 ${
                          assetType === type
                            ? "border-cyan-500 bg-cyan-900/20"
                            : "border-gray-700 hover:border-cyan-400"
                        }`}
                      >
                        <div className="text-cyan-400 text-xl mb-2">
                          {type === "image" && <i className="fas fa-image"></i>}
                          {type === "video" && <i className="fas fa-video"></i>}
                          {type === "audio" && <i className="fas fa-music"></i>}
                          {type === "3d" && <i className="fas fa-cube"></i>}
                        </div>
                        <span className="capitalize">{type}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold mb-4">Collection Type</h3>
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <button
                      type="button"
                      onClick={() =>
                        setCollectionData({
                          ...collectionData,
                          collectionType: "homogeneous",
                        })
                      }
                      className={`p-4 rounded-xl border transition-all duration-300 ${
                        collectionData.collectionType === "homogeneous"
                          ? "border-cyan-500 bg-cyan-900/20"
                          : "border-gray-700 hover:border-cyan-400"
                      }`}
                    >
                      <div className="text-cyan-400 text-xl mb-2">
                        <i className="fas fa-th-large"></i>
                      </div>
                      <h4 className="font-bold">Homogeneous</h4>
                      <p className="text-gray-500 text-sm">Same asset type</p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setCollectionData({
                          ...collectionData,
                          collectionType: "heterogeneous",
                        })
                      }
                      className={`p-4 rounded-xl border transition-all duration-300 ${
                        collectionData.collectionType === "heterogeneous"
                          ? "border-cyan-500 bg-cyan-900/20"
                          : "border-gray-700 hover:border-cyan-400"
                      }`}
                    >
                      <div className="text-cyan-400 text-xl mb-2">
                        <i className="fas fa-random"></i>
                      </div>
                      <h4 className="font-bold">Heterogeneous</h4>
                      <p className="text-gray-500 text-sm">Mixed asset types</p>
                    </button>
                  </div>

                  <h3 className="text-xl font-bold mb-4">Upload Assets</h3>
                  <div
                    className="bg-gray-900/50 border-2 border-dashed border-cyan-900/30 rounded-xl p-8 text-center cursor-pointer hover:border-cyan-500 transition-colors duration-300"
                    onClick={() => collectionFileInputRef.current?.click()}
                  >
                    <div className="text-cyan-400 text-4xl mb-4">
                      <i className="fas fa-cloud-upload-alt"></i>
                    </div>
                    <p className="font-medium">Click to upload your files</p>
                    <p className="text-gray-500 text-sm mt-2">
                      {collectionData.collectionType === "homogeneous"
                        ? `Upload multiple ${assetType} files`
                        : "Upload any combination of supported files"}
                    </p>
                    <input
                      type="file"
                      ref={collectionFileInputRef}
                      onChange={(e) => handleFileChange(e)}
                      className="hidden"
                      multiple
                      accept={
                        collectionData.collectionType === "homogeneous"
                          ? assetType === "image"
                            ? "image/*"
                            : assetType === "video"
                            ? "video/*"
                            : assetType === "audio"
                            ? "audio/*"
                            : assetType === "3d"
                            ? ".glb,.gltf,.obj,.stl"
                            : "*"
                          : "image/*,video/*,audio/*,.glb,.gltf,.obj,.stl"
                      }
                    />
                  </div>

                  {collectionData.assets.length > 0 && (
                    <>
                      <div className="mt-4 bg-gray-900/30 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-medium">
                            {collectionData.assets.length} files selected
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              setCollectionData({ ...collectionData, assets: [] })
                            }
                            className="text-red-500 hover:text-red-400 text-sm"
                          >
                            Clear all
                          </button>
                        </div>
                        <div className="max-h-40 overflow-y-auto">
                          {collectionData.assets.map((asset, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0"
                            >
                              <div className="flex items-center">
                                <div className="text-cyan-400 mr-2">
                                  <i className="fas fa-file"></i>
                                </div>
                                <p className="text-sm truncate max-w-xs">
                                  {asset.name}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const newAssets = [...collectionData.assets];
                                  newAssets.splice(index, 1);
                                  setCollectionData({
                                    ...collectionData,
                                    assets: newAssets,
                                  });
                                }}
                                className="text-red-500 hover:text-red-400"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-6">
                        <h3 className="text-xl font-bold mb-4">
                          Upload Collection Preview Image
                        </h3>
                        <div
                          className="bg-gray-900/50 border-2 border-dashed border-cyan-900/30 rounded-xl p-8 text-center cursor-pointer hover:border-cyan-500 transition-colors duration-300"
                          onClick={() =>
                            collectionMainPreviewInputRef.current?.click()
                          }
                        >
                          <div className="text-cyan-400 text-4xl mb-4">
                            <i className="fas fa-image"></i>
                          </div>
                          <p className="font-medium">
                            Click to upload collection preview
                          </p>
                          <p className="text-gray-500 text-sm mt-2">
                            JPG, PNG - Max 10MB
                          </p>
                          <input
                            type="file"
                            ref={collectionMainPreviewInputRef}
                            onChange={(e) => handleFileChange(e, false, true)}
                            className="hidden"
                            accept="image/*"
                          />
                        </div>

                        {collectionData.collectionPreviewImage && (
                          <div className="mt-4 bg-gray-900/30 rounded-lg p-3 flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="text-cyan-400 mr-3">
                                <i className="fas fa-image"></i>
                              </div>
                              <div>
                                <p className="text-sm">
                                  {collectionData.collectionPreviewImage.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(
                                    collectionData.collectionPreviewImage.size /
                                    1024 /
                                    1024
                                  ).toFixed(2)}{" "}
                                  MB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setCollectionData({
                                  ...collectionData,
                                  collectionPreviewImage: null,
                                });
                                setPreviewUrl("");
                              }}
                              className="text-red-500 hover:text-red-400"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-4">Collection Preview</h3>
                  {collectionData.collectionPreviewImage && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold mb-2">Main Preview</h4>
                      <div className="h-64 w-full bg-gray-800/50 rounded-xl flex items-center justify-center overflow-hidden">
                        <Image
                          src={URL.createObjectURL(collectionData.collectionPreviewImage)}
                          alt="Collection preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                  <h4 className="text-lg font-semibold mb-2">Assets Preview</h4>
                  {renderCollectionPreview()}
                </div>
              </div>
            </>
          )}
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="space-y-8">
          {activeTab === "single" ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold mb-4">NFT Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-400 mb-2">
                        NFT Name *
                      </label>
                      <input
                        type="text"
                        value={nftData.name}
                        onChange={(e) =>
                          setNftData({ ...nftData, name: e.target.value })
                        }
                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        placeholder="Enter NFT name"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-2">
                        Description
                      </label>
                      <textarea
                        value={nftData.description}
                        onChange={(e) =>
                          setNftData({
                            ...nftData,
                            description: e.target.value,
                          })
                        }
                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent h-32"
                        placeholder="Describe your NFT"
                      />
                    </div>

                    <div>
                      <div className="mt-6">
                        <label className="block text-gray-400 mb-2">
                          Attributes
                        </label>
                        <div className="space-y-3">
                          {nftData.attributes.map((attr, index) => (
                            <div
                              key={index}
                              className="flex gap-3 items-center"
                            >
                              <input
                                type="text"
                                value={attr.trait}
                                onChange={(e) =>
                                  handleAttributeChange(
                                    index,
                                    "trait",
                                    e.target.value
                                  )
                                }
                                className="flex-1 bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-transparent"
                                placeholder="Trait (e.g. Color)"
                              />
                              <input
                                type="text"
                                value={attr.value}
                                onChange={(e) =>
                                  handleAttributeChange(
                                    index,
                                    "value",
                                    e.target.value
                                  )
                                }
                                className="flex-1 bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-transparent"
                                placeholder="Value (e.g. Blue)"
                              />
                              <button
                                type="button"
                                onClick={() => removeAttribute(index)}
                                className={`bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-red-400 w-8 h-8 rounded-lg transition-colors flex items-center justify-center ${
                                  nftData.attributes.length === 1
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                                title="Remove attribute"
                                disabled={nftData.attributes.length === 1}
                              >
                                <i className="fas fa-trash text-sm"></i>
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={addAttribute}
                            disabled={nftData.attributes.some(
                              (attr) =>
                                attr.trait.trim() === "" ||
                                attr.value.trim() === ""
                            )}
                            className={`text-cyan-500 hover:text-cyan-400 flex items-center ${
                              nftData.attributes.some(
                                (attr) =>
                                  attr.trait.trim() === "" ||
                                  attr.value.trim() === ""
                              )
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <i className="fas fa-plus mr-2"></i> Add Attribute
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-4">Pricing</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-400 mb-2">
                        Price (OG)
                      </label>
                      <input
                        type="number"
                        value={nftData.price}
                        onChange={(e) =>
                          setNftData({ ...nftData, price: e.target.value })
                        }
                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-2">
                        Royalty (%)
                      </label>
                      <input
                        type="number"
                        value={nftData.royalty}
                        onChange={(e) =>
                          setNftData({ ...nftData, royalty: e.target.value })
                        }
                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        placeholder="5"
                        min="0"
                        max="20"
                        step="0.1"
                      />
                    </div>
                  </div>

                  <div className="mt-8">
                    <h3 className="text-xl font-bold mb-4">Collection Options</h3>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="noCollection"
                          name="collectionOption"
                          checked={nftData.collectionOption === "none"}
                          onChange={() =>
                            setNftData({ ...nftData, collectionOption: "none" })
                          }
                          className="h-4 w-4 text-cyan-500 border-gray-600 focus:ring-cyan-500"
                        />
                        <label
                          htmlFor="noCollection"
                          className="ml-3 cursor-pointer"
                        >
                          No Collection
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="existingCollection"
                          name="collectionOption"
                          checked={nftData.collectionOption === "existing"}
                          onChange={() =>
                            setNftData({ ...nftData, collectionOption: "existing" })
                          }
                          className="h-4 w-4 text-cyan-500 border-gray-600 focus:ring-cyan-500"
                        />
                        <label
                          htmlFor="existingCollection"
                          className="ml-3 cursor-pointer"
                        >
                          Add to Existing Collection
                        </label>
                      </div>

                      {nftData.collectionOption === "existing" && (
                        <div className="ml-7">
                          <label className="block text-gray-400 mb-2">
                            Select Collection
                          </label>
                          <select
                            value={nftData.existingCollection}
                            onChange={(e) =>
                              setNftData({
                                ...nftData,
                                existingCollection: e.target.value,
                              })
                            }
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          >
                            <option value="">Select a collection</option>
                            {existingCollections.map((collection) => (
                              <option key={collection.id} value={collection.id}>
                                {collection.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold mb-4">Collection Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-400 mb-2">
                        Collection Name *
                      </label>
                      <input
                        type="text"
                        value={collectionData.name}
                        onChange={(e) =>
                          setCollectionData({
                            ...collectionData,
                            name: e.target.value,
                          })
                        }
                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        placeholder="Enter collection name"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-2">
                        Description
                      </label>
                      <textarea
                        value={collectionData.description}
                        onChange={(e) =>
                          setCollectionData({
                            ...collectionData,
                            description: e.target.value,
                          })
                        }
                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent h-32"
                        placeholder="Describe your collection"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-2">
                        Floor Price (OG) *
                      </label>
                      <input
                        type="number"
                        value={collectionData.floorPrice}
                        onChange={(e) =>
                          setCollectionData({
                            ...collectionData,
                            floorPrice: e.target.value,
                          })
                        }
                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-2">
                        Royalty (%)
                      </label>
                      <input
                        type="number"
                        value={collectionData.royalty}
                        onChange={(e) =>
                          setCollectionData({
                            ...collectionData,
                            royalty: e.target.value,
                          })
                        }
                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        placeholder="5"
                        min="0"
                        max="20"
                        step="0.1"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-xl font-bold mb-4">
                      Collection Options
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="createNewCollection"
                          name="collectionCreationOption"
                          checked={collectionData.createNewCollection}
                          onChange={() =>
                            setCollectionData({
                              ...collectionData,
                              createNewCollection: true,
                            })
                          }
                          className="h-4 w-4 text-cyan-500 border-gray-600 focus:ring-cyan-500"
                        />
                        <label
                          htmlFor="createNewCollection"
                          className="ml-3 cursor-pointer"
                        >
                          Create New Collection
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="addToExistingCollection"
                          name="collectionCreationOption"
                          checked={!collectionData.createNewCollection}
                          onChange={() =>
                            setCollectionData({
                              ...collectionData,
                              createNewCollection: false,
                            })
                          }
                          className="h-4 w-4 text-cyan-500 border-gray-600 focus:ring-cyan-500"
                        />
                        <label
                          htmlFor="addToExistingCollection"
                          className="ml-3 cursor-pointer"
                        >
                          Add to Existing Collection
                        </label>
                      </div>

                      {!collectionData.createNewCollection && (
                        <div className="ml-7">
                          <label className="block text-gray-400 mb-2">
                            Select Collection
                          </label>
                          <select
                            value={collectionData.existingCollection}
                            onChange={(e) =>
                              setCollectionData({
                                ...collectionData,
                                existingCollection: e.target.value,
                              })
                            }
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          >
                            <option value="">Select a collection</option>
                            {existingCollections.map((collection) => (
                              <option key={collection.id} value={collection.id}>
                                {collection.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-4">Attributes</h3>
                  
                  <div className="mb-8">
                    <h4 className="text-lg font-medium mb-3">Common Attributes</h4>
                    <p className="text-gray-400 mb-4">
                      These attributes will be applied to all NFTs in the collection
                    </p>
                    <div className="space-y-3">
                      {commonAttributes.map((attr, index) => (
                        <div key={`common-${index}`} className="flex gap-3 items-center">
                          <input
                            type="text"
                            value={attr.trait}
                            onChange={(e) => handleCommonAttributeChange(index, "trait", e.target.value)}
                            className="flex-1 bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-transparent"
                            placeholder="Trait (e.g. Background)"
                          />
                          <input
                            type="text"
                            value={attr.value}
                            onChange={(e) => handleCommonAttributeChange(index, "value", e.target.value)}
                            className="flex-1 bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-transparent"
                            placeholder="Value (e.g. Blue)"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newAttrs = [...commonAttributes];
                              newAttrs.splice(index, 1);
                              setCommonAttributes(newAttrs);
                            }}
                            className="text-red-500 hover:text-red-400 w-8 h-8 rounded-lg flex items-center justify-center"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addCommonAttribute}
                        disabled={commonAttributes.some(
                          (attr) =>
                            attr.trait.trim() === "" ||
                            attr.value.trim() === ""
                        )}
                        className={`text-cyan-500 hover:text-cyan-400 flex items-center ${
                          commonAttributes.some(
                            (attr) =>
                              attr.trait.trim() === "" ||
                              attr.value.trim() === ""
                          )
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <i className="fas fa-plus mr-2"></i> Add Common Attribute
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium mb-3">Unique Attributes</h4>
                    <p className="text-gray-400 mb-4">
                      These attributes are specific to each NFT
                    </p>
                    <div className="space-y-6">
                      {collectionData.assets.map((asset, nftIndex) => (
                        <div key={`nft-${nftIndex}`} className="bg-gray-900/30 p-4 rounded-lg">
                          <h5 className="font-medium mb-3">{collectionData.name} #{nftIndex + 1}</h5>
                          <div className="space-y-3">
                            {(uniqueAttributes[nftIndex] || []).map((attr, attrIndex) => (
                              <div key={`unique-${nftIndex}-${attrIndex}`} className="flex gap-3 items-center">
                                <input
                                  type="text"
                                  value={attr.trait}
                                  onChange={(e) => handleUniqueAttributeChange(nftIndex, attrIndex, "trait", e.target.value)}
                                  className="flex-1 bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-transparent"
                                  placeholder="Trait (e.g. Hat)"
                                />
                                <input
                                  type="text"
                                  value={attr.value}
                                  onChange={(e) => handleUniqueAttributeChange(nftIndex, attrIndex, "value", e.target.value)}
                                  className="flex-1 bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-transparent"
                                  placeholder="Value (e.g. Red)"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newAttrs = [...uniqueAttributes];
                                    newAttrs[nftIndex].splice(attrIndex, 1);
                                    setUniqueAttributes(newAttrs);
                                  }}
                                  className="text-red-500 hover:text-red-400 w-8 h-8 rounded-lg flex items-center justify-center"
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => addUniqueAttribute(nftIndex)}
                              disabled={uniqueAttributes[nftIndex]?.some(
                                (attr) =>
                                  attr.trait.trim() === "" ||
                                  attr.value.trim() === ""
                              )}
                              className={`text-cyan-500 hover:text-cyan-400 flex items-center text-sm ${
                                uniqueAttributes[nftIndex]?.some(
                                  (attr) =>
                                    attr.trait.trim() === "" ||
                                    attr.value.trim() === ""
                                )
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                            >
                              <i className="fas fa-plus mr-2"></i> Add Unique Attribute
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-[#0a0f1f] text-white py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Create NFT
          </h1>
          <p className="mt-4 text-xl text-gray-400 max-w-3xl mx-auto">
            Mint unique digital assets on the 0G blockchain
          </p>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-900/30 rounded-2xl overflow-hidden">
          <div className="border-b border-cyan-900/30">
            <div className="flex">
              {[1, 2, 3].map((num) => (
                <div
                  key={num}
                  className={`flex-1 py-4 text-center cursor-pointer transition-colors duration-300 ${
                    step === num
                      ? "bg-cyan-900/20 border-b-2 border-cyan-500"
                      : "hover:bg-gray-800/50"
                  }`}
                  onClick={() => setStep(num)}
                >
                  <div
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                      step === num
                        ? "bg-cyan-500 text-white"
                        : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    {num}
                  </div>
                  <div className="mt-2 text-sm">
                    {num === 1 && "Setup"}
                    {num === 2 && activeTab === "single" ? "Asset" : "Assets"}
                    {num === 3 && "Details"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit}>
              {renderStepContent()}

              {isLoading && (
                <div className="mt-6 bg-gray-800/50 rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-cyan-500 h-2.5 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="mt-12 flex justify-between">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="px-6 py-3 bg-gray-800/50 hover:bg-gray-700 rounded-lg transition-colors duration-300"
                    disabled={isLoading}
                  >
                    Back
                  </button>
                ) : (
                  <div></div>
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 rounded-lg transition-all duration-300"
                    disabled={isLoading}
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`px-8 py-3 rounded-lg transition-all duration-300 ${
                      isLoading
                        ? "bg-gray-700 cursor-not-allowed"
                        : "bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600"
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        {activeTab === "single"
                          ? "Creating NFT..."
                          : "Creating Collection..."}
                      </span>
                    ) : (
                      <span>
                        {activeTab === "single"
                          ? "Create NFT"
                          : "Create Collection"}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Powered by 0G Chain • Near-zero gas fees • Instant transactions</p>
        </div>
      </div>
    </div>
  );
};

export default CreatePage;