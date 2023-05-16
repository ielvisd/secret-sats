import React, { useState, useRef } from "react";
import { useParams } from 'react-router-dom';
import { Helloworld } from "./contracts/helloworld";
import { DefaultProvider, SensiletSigner, toHex, sha256, toByteString } from "scrypt-ts";
var artifact = require('../artifacts/helloworld.json');

function UnlockPage(props: { match: { params: { txid: any; }; }; }) {
  const [secretPhrase, setSecretPhrase] = useState("");
  const [contract, setContract] = useState<Helloworld | undefined>(undefined)
  const signerRef = useRef<SensiletSigner>();
  const [isConnected, setConnected] = useState(false);
  const [userPubkey, setUserPubkey] = useState("");
  const [userBalance, setUserBalance] = useState(0);

  const sensiletLogin = async () => {
    try {
      const provider = new DefaultProvider();
      const signer = new SensiletSigner(provider);
      signerRef.current = signer;

      const { isAuthenticated, error } = await signer.requestAuth();
      if (!isAuthenticated) {
        throw new Error(error);
      }

      setConnected(true);

      const userPubkey = await signer.getDefaultPubKey();
      setUserPubkey(toHex(userPubkey));

      signer.getBalance().then((balance) => {
        // UTXOs belonging to transactions in the mempool are unconfirmed
        setUserBalance(balance.confirmed + balance.unconfirmed);
      });

      // Prompt user to switch accounts
    } catch (error) {
      console.error("sensiletLogin failed", error);
      alert("sensiletLogin failed");
    }
  };

  function handleInputChange(event: { target: { value: React.SetStateAction<string>; }; }) {
    setSecretPhrase(event.target.value);
  }



  const params = useParams();

  async function handleUnlock() {

    const provider = new DefaultProvider();
    const signer = new SensiletSigner(provider);
    // TODO: Add code to unlock based on secret phrase
          // 1) fetch a transaction from txid
      const tx = await signer.connectedProvider.getTransaction(params.txid)
      // 2) create instance from transaction
      console.log('tx', tx)
      Helloworld.loadArtifact(artifact)
      const instance = Helloworld.fromTx(tx, 0)
      instance.connect(signer)
      console.log('instance', instance)
      const unlockMessage = toByteString(secretPhrase, true)
      const { tx: callTx } = await instance.methods.unlock(unlockMessage)

      console.log('callTx', callTx)
  }

  const pageTitle = `Unlock ${params.txid}`;

  const inputStyles = {
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    width: "100%",
    boxSizing: "border-box" as const, // Define boxSizing as a string literal
    marginBottom: "20px"
  };

  const buttonStyles = {
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    padding: "10 20px",
    cursor: "pointer",
    fontSize: "16px"
  };

  return (
    <div className="App">

    {isConnected ? (<div style={{ maxWidth: "500px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center" }}>{pageTitle}</h1>
      <form>
        <label htmlFor="secretPhrase" style={{ display: "block", marginBottom: "10px" }}>Secret Phrase:</label>
        <input
          type="password"
          id="secretPhrase"
          placeholder="Enter your secret phrase"
          value={secretPhrase}
          onChange={handleInputChange}
          style={inputStyles}
        />
        <button
          type="button"
          onClick={handleUnlock}
          style={buttonStyles}
        >
          Unlock
        </button>
      </form>
    </div>) : (
          <button
            className="form-button"
            onClick={sensiletLogin}
          >
            Connect Wallet
          </button>
        )}

</div>);
}

export default UnlockPage;
