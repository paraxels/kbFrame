"use client";

import { useEffect, useCallback, useState, useMemo } from "react";
import sdk, {
  FrameNotificationDetails,
  type FrameContext,
} from "@farcaster/frame-sdk";
import {
  useAccount,
  useSendTransaction,
  useSignMessage,
  useSignTypedData,
  useWaitForTransactionReceipt,
  useDisconnect,
  useConnect,
  useSwitchChain,
  useChainId,
} from "wagmi";

import { config } from "~/components/providers/WagmiProvider";
import { Button } from "~/components/ui/Button";
import { truncateAddress } from "~/lib/truncateAddress";
import { mainnet,
   optimism,
   polygon,
   base,
   arbitrum,
   degen } from "wagmi/chains";
import { BaseError, UserRejectedRequestError, parseEther } from "viem";


export default function Demo(
  { title }: { title?: string } = { title: "kb test" }
) {
  const URL = "https://www.wikipedia.org/";



  const [appUrl, setAppUrl] = useState('');
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<FrameContext>();
  const [logger, setLogger] = useState({});
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [selectedChain, setSelectedChain] = useState("base");
  const [ethPrice, setEthPrice] = useState();
  const [donationInProgress, setDonationInProgress] = useState(false);
  const [donationMade, setDonationMade] = useState(false);
  const [url, setUrl] = useState();

  const [added, setAdded] = useState(false);
    useState<FrameNotificationDetails | null>(null);

  const [lastEvent, setLastEvent] = useState("");

  const [addFrameResult, setAddFrameResult] = useState("");

  const blockExplorerLinks = {
    'base': 'https://basescan.org/tx/',
    'optimism': 'https://optimistic.etherscan.io/tx/',
    'mainnet': 'https://etherscan.io/tx/'
  }
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const {
    sendTransaction,
    error: sendTxError,
    isError: isSendTxError,
    isPending: isSendTxPending,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

  const {
    signTypedData,
    error: signTypedError,
    isError: isSignTypedError,
    isPending: isSignTypedPending,
  } = useSignTypedData();

  const { disconnect } = useDisconnect();
  const { connect } = useConnect();

  const {
    switchChain,
    error: switchChainError,
    isError: isSwitchChainError,
    isPending: isSwitchChainPending,
  } = useSwitchChain();

  useEffect(() => {
    async function func() {
      const res = await fetch(`https://kbtestframe.replit.app/api/getUrl`);
      const data = await res.json();
      console.log('iframe url', data.url)
      setUrl(data.url);
    }

    func();
  }, [])

  const handleSwitchChain = useCallback(() => {
    switchChain({ chainId: chainId === base.id ? optimism.id : base.id });
  }, [switchChain, chainId]);

  const switchToBase = () => {
    switchChain({ chainId: base.id });
  };
  
  const switchToMainnet = () => {
    switchChain({ chainId: mainnet.id });
  };
  
  const switchToOptimism = () => {
    switchChain({ chainId: optimism.id });
  };

  const switchToPolygon = () => {
    switchChain({ chainId: polygon.id });
  };

  const switchToArbitrum = () => {
    switchChain({ chainId: arbitrum.id });
  };

  const switchToDegen = () => {
    switchChain({ chainId: degen.id });
  };

  const getEndaomentTxDetails = async (chainId: any, amount: any, tokenAddress = null) => {
    try {
      const response = await fetch(
        `https://api.endaoment.org/v1/sdk/donations/swap?id=d937a50f-336b-4f0a-8143-7b47b03d0988&chainId=${chainId}&amountIn=${amount}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
        setLogger(response)
      }

      const data = await response.json();

      return data;
    } catch (e) {
      return null;
    }
  }

  const donate = async () => {
    if(!donationInProgress) {
      setDonationInProgress(true);
      let chainId;
      let tokenAddress;
      console.log('selectedChain', selectedChain)
      switch (selectedChain) {
          case 'mainnet':
            await switchToMainnet();
            chainId = mainnet.id;
            break;
  
          case 'base':
            console.log('in base case', selectedChain)
            chainId = base.id;
            await switchToBase();
            break;
  
          case 'optimism':
            await switchToOptimism();
            chainId = optimism.id;
            break;
  
          case 'arbitrum':
            await switchToArbitrum();
            chainId = arbitrum.id;
            break;
  
          case 'polygon':
            await switchToPolygon();
            chainId = polygon.id;
            break;
      }
      // let amount = parseEther(amount.toString());
      
      const txDetails = await getEndaomentTxDetails(chainId, parseEther(amount.toString()), tokenAddress)
      txDetails.chainId = chainId;
  
      sendDonationTx(txDetails);
      
      console.log('tx details', txDetails)
      setLogger(txDetails)
    }
  }

  const sendDonationTx = async (details) => {
    sendTransaction(
      details,
      {
        onSuccess: async (hash) => {
          const fid = context.user.fid ? context.user.fid : "";
          const timestamp = Date.now();
          await saveDonationReceipt(timestamp, fid, selectedChain, amount.toString());
          setDonationInProgress(false);
          setTxHash(hash);
          setDonationMade(true);
        },
        onError: (error) => {
          setDonationInProgress(false);
        }
      }
    );
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAppUrl(window.location.origin); // Get the base URL
    }
    
  }, [])

  const openCast = () => {
    sdk.actions.openUrl(`https://warpcast.com/~/compose?text=I%20just%20donated%20to%20South%20Castle%27s%20New%20Year%20charity%20drive%20supporting%20GiveDirectly%21%0A%0ACheck%20out%20the%20frame%20below%20if%20you%27d%20like%20to%20make%20a%20contribution%20to%20support%20this%20great%20cause%0A%0A%F0%9F%8F%B0%20%21attack%20north%20%26%20Happy%20New%20Year%21%20%F0%9F%8F%B0
    &embeds[]=${appUrl}`)
  }

  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      setContext(context);
      console.log('context', context)

      sdk.on("primaryButtonClicked", () => {
        console.log("primaryButtonClicked");
      });

      sdk.actions.ready({});
    };
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded]);

  const saveDonationReceipt = async (url: string) => {
    console.log('in func')
    let res = await fetch('/api/setUrl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });
    console.log(res)
  };

  
  const close = useCallback(() => {
    sdk.actions.close();
  }, []);

  const toggleContext = useCallback(() => {
    setIsContextOpen((prev) => !prev);
  }, []);

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ 
      paddingTop: context?.client.safeAreaInsets?.top ?? 0, 
      paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
      paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
      paddingRight: context?.client.safeAreaInsets?.right ?? 0 ,
    }}>
      <iframe src={URL}></iframe>
    </div>
  );
}


const renderError = (error: Error | null) => {
  if (!error) return null;
  if (error instanceof BaseError) {
    const isUserRejection = error.walk(
      (e) => e instanceof UserRejectedRequestError
    );

    if (isUserRejection) {
      return <div className="text-red-500 text-xs mt-1">Rejected by user.</div>;
    }
  }

  return <div className="text-red-500 text-xs mt-1">{error.message}</div>;
};
