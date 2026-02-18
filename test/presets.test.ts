import test from "node:test";
import assert from "node:assert/strict";

import { cip30WalletPreset, meshProviderPreset } from "../src/index.ts";

test("meshProviderPreset maps submit and fetch methods to provider contexts", async () => {
  const provider = {
    async submitTx(): Promise<string> {
      throw new Error("submit timeout");
    },
    async fetchAddressUTxOs(): Promise<string[]> {
      throw new Error("fetch timeout");
    }
  };

  const safeProvider = meshProviderPreset(provider, { provider: "blockfrost" });

  await assert.rejects(
    () => safeProvider.submitTx(),
    (err: unknown) => {
      const normalized = err as {
        source: string;
        stage: string;
        provider?: string;
        meta?: Record<string, unknown>;
      };

      assert.equal(normalized.source, "provider_submit");
      assert.equal(normalized.stage, "submit");
      assert.equal(normalized.provider, "blockfrost");
      assert.equal(normalized.meta?.safeProviderMethod, "submitTx");
      return true;
    }
  );

  await assert.rejects(
    () => safeProvider.fetchAddressUTxOs(),
    (err: unknown) => {
      const normalized = err as {
        source: string;
        stage: string;
        provider?: string;
        meta?: Record<string, unknown>;
      };

      assert.equal(normalized.source, "provider_query");
      assert.equal(normalized.stage, "build");
      assert.equal(normalized.provider, "blockfrost");
      assert.equal(normalized.meta?.safeProviderMethod, "fetchAddressUTxOs");
      return true;
    }
  );
});

test("meshProviderPreset defaults unknown method context to provider_query/build", async () => {
  const provider = {
    async health(): Promise<string> {
      throw new Error("offline");
    }
  };

  const safeProvider = meshProviderPreset(provider);

  await assert.rejects(
    () => safeProvider.health(),
    (err: unknown) => {
      const normalized = err as { source: string; stage: string };
      assert.equal(normalized.source, "provider_query");
      assert.equal(normalized.stage, "build");
      return true;
    }
  );
});

test("cip30WalletPreset maps wallet methods to CIP-30 contexts", async () => {
  const walletApi = {
    async getUtxos(): Promise<string[]> {
      throw new Error("query failed");
    },
    async signData(): Promise<string> {
      throw new Error("user declined");
    },
    async submitTx(): Promise<string> {
      throw new Error("submit failed");
    }
  };

  const safeWallet = cip30WalletPreset(walletApi, { walletHint: "eternl" });

  await assert.rejects(
    () => safeWallet.getUtxos(),
    (err: unknown) => {
      const normalized = err as {
        source: string;
        stage: string;
        wallet?: { name?: string };
        meta?: Record<string, unknown>;
      };

      assert.equal(normalized.source, "wallet_query");
      assert.equal(normalized.stage, "build");
      assert.equal(normalized.wallet?.name, "eternl");
      assert.equal(normalized.meta?.safeProviderMethod, "getUtxos");
      return true;
    }
  );

  await assert.rejects(
    () => safeWallet.signData(),
    (err: unknown) => {
      const normalized = err as {
        source: string;
        stage: string;
        wallet?: { name?: string };
        meta?: Record<string, unknown>;
      };

      assert.equal(normalized.source, "wallet_sign");
      assert.equal(normalized.stage, "sign");
      assert.equal(normalized.wallet?.name, "eternl");
      assert.equal(normalized.meta?.safeProviderMethod, "signData");
      return true;
    }
  );

  await assert.rejects(
    () => safeWallet.submitTx(),
    (err: unknown) => {
      const normalized = err as {
        source: string;
        stage: string;
        wallet?: { name?: string };
        meta?: Record<string, unknown>;
      };

      assert.equal(normalized.source, "wallet_submit");
      assert.equal(normalized.stage, "submit");
      assert.equal(normalized.wallet?.name, "eternl");
      assert.equal(normalized.meta?.safeProviderMethod, "submitTx");
      return true;
    }
  );
});

