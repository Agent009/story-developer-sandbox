"use client";
import { iliad } from "@/app/Web3Providers";
import { PropsWithChildren, createContext } from "react";
import { useContext, useState } from "react";
import { Address, createPublicClient, createWalletClient, custom } from "viem";
import { useWalletClient } from "wagmi";
import { defaultNftContractAbi } from "../defaultNftContractAbi";

interface AppContextType {
  txLoading: boolean;
  txHash: string;
  txName: string;
  error: string;
  transactions: { txHash: string; action: string; data: any }[];
  setTxLoading: (loading: boolean) => void;
  setTxHash: (txHash: string) => void;
  setTxName: (txName: string) => void;
  setError: (txName: string) => void;
  mintNFT: (to: Address, uri: string) => Promise<string>;
  addTransaction: (txHash: string, action: string, data: any) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const useStory = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useStory must be used within a AppProvider");
  }
  return context;
};

export default function AppProvider({ children }: PropsWithChildren) {
  const [txLoading, setTxLoading] = useState<boolean>(false);
  const [txName, setTxName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");
  const [transactions, setTransactions] = useState<
    { txHash: string; action: string; data: any }[]
  >([]);
  const { data: wallet } = useWalletClient();

  const mintNFT = async (to: Address, uri: string) => {
    if (!window.ethereum) return "";
    console.log("Minting a new NFT...");
    const walletClient = createWalletClient({
      account: wallet?.account.address as Address,
      chain: iliad,
      transport: custom(window.ethereum),
    });
    const publicClient = createPublicClient({
      transport: custom(window.ethereum),
      chain: iliad,
    });

    const { request } = await publicClient.simulateContract({
      address: "0xd2a4a4Cb40357773b658BECc66A6c165FD9Fc485",
      functionName: "mintNFT",
      args: [to, uri],
      abi: defaultNftContractAbi,
    });
    const hash = await walletClient.writeContract(request);
    console.log(`Minted NFT successful with hash: ${hash}`);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const tokenId = Number(receipt.logs[0].topics[3]).toString();
    console.log(`Minted NFT tokenId: ${tokenId}`);
    addTransaction(hash, "Mint NFT", { tokenId });
    return tokenId;
  };

  const addTransaction = (txHash: string, action: string, data: any) => {
    setTransactions((oldTxs) => [...oldTxs, { txHash, action, data }]);
  };

  return (
    <AppContext.Provider
      value={{
        txLoading,
        txHash,
        txName,
        error,
        transactions,
        setTxLoading,
        setTxName,
        setTxHash,
        setError,
        mintNFT,
        addTransaction,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
