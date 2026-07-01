"use client";

import type { ModelProviderGroup } from "@llm-space/core";
import {
  ExternalLink,
  Eye,
  EyeOff,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Fragment, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Item, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { ConfirmDialog } from "../confirm-dialog";
import { Link } from "../link";
import {
  useAddProvider,
  useFetchBuiltinProviders,
  useModels,
  useRemoveProvider,
  useUpdateProvider,
} from "../model-provider";
import { ModelAvatar } from "../thread-playground/model-avatar";
import { ProviderAvatar } from "../thread-playground/provider-avatar";
import { Tooltip } from "../tooltip";
import { ScrollArea } from "../ui/scroll-area";

import { SettingsPage } from "./settings-page";

export function ModelsPage() {
  const providers = useModels();
  const [selectedId, setSelectedId] = useState<string | null>(
    providers[0]?.id ?? null
  );

  const selected =
    providers.find((provider) => provider.id === selectedId) ?? null;

  return (
    <SettingsPage className="flex size-full min-h-0" title="Models">
      <ProviderList
        providers={providers}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <ProviderEditor key={selected?.id} provider={selected} />
    </SettingsPage>
  );
}

function ProviderList({
  providers,
  selectedId,
  onSelect,
}: {
  providers: ModelProviderGroup[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? providers.filter((provider) => provider.name.toLowerCase().includes(q))
      : providers;
    return [...matched].sort((a, b) => a.name.localeCompare(b.name));
  }, [providers, query]);

  return (
    <div className="flex w-64 shrink-0 flex-col gap-3 border-r pr-4">
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2" />
        <Input
          className="h-8 pl-7"
          placeholder="Search providers"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <ScrollArea className="min-h-0 grow">
        {providers.length === 0 ? (
          <div className="text-muted-foreground px-2 py-6 text-center text-xs text-balance">
            No providers yet. Click the &quot;Add provider&quot; button below to
            get started.
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-muted-foreground px-2 py-6 text-center text-xs text-balance">
            No provider matches &quot;{query.trim()}&quot;.
          </div>
        ) : (
          <div className="flex flex-col gap-1 pr-2">
            {filtered.map((provider) => (
              <ProviderListItem
                key={provider.id}
                provider={provider}
                selected={provider.id === selectedId}
                onSelect={() => onSelect(provider.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      <AddProviderMenu />
    </div>
  );
}

/**
 * Recommended builtin providers, shown in their own menu group. The `google`
 * provider backs Gemini.
 */
const RECOMMENDED_PROVIDER_IDS = new Set([
  "ark",
  "ark-coding-plan",
  "openai",
  "anthropic",
  "google",
  "deepseek",
]);

/**
 * The "Add provider" upward menu. Lists every builtin provider, split into
 * priority groups: Discovered (an API key was detected and it isn't configured
 * yet), Recommended, then Built-in. Each provider lands in the highest group it
 * qualifies for; empty groups are omitted. Already-configured providers are
 * checked.
 */
function AddProviderMenu() {
  const configured = useModels();
  const addProvider = useAddProvider();
  const fetchBuiltins = useFetchBuiltinProviders();
  const [open, setOpen] = useState(false);
  const [builtins, setBuiltins] = useState<ModelProviderGroup[] | null>(null);

  const configuredIds = useMemo(
    () => new Set(configured.map((provider) => provider.id)),
    [configured]
  );

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      void fetchBuiltins()
        .then(setBuiltins)
        .catch((error) => console.error("Failed to load providers", error));
    }
  };

  const groups = useMemo(() => {
    const discovered: ModelProviderGroup[] = [];
    const recommended: ModelProviderGroup[] = [];
    const rest: ModelProviderGroup[] = [];
    for (const provider of builtins ?? []) {
      // Only offer providers that haven't been added yet.
      if (configuredIds.has(provider.id)) {
        continue;
      }
      if (provider.apiKeyDetected) {
        discovered.push(provider);
      } else if (RECOMMENDED_PROVIDER_IDS.has(provider.id)) {
        recommended.push(provider);
      } else {
        rest.push(provider);
      }
    }
    const discoveredCount = discovered.length;
    const groups = [];
    if (discoveredCount > 0) {
      groups.push({
        id: "discovered",
        label: (
          <div className="flex flex-col gap-2">
            <div className="text-foreground text-xs font-medium">
              Discovered
            </div>
            <div className="flex gap-1 pl-1">
              {discoveredCount}{" "}
              {discoveredCount === 1 ? "provider" : "providers"} discovered in
              your environment
            </div>
          </div>
        ),
        items: discovered,
      });
    }
    if (recommended.length > 0) {
      groups.push({
        id: "recommended",
        label: "Recommended",
        items: recommended,
      });
    }
    if (rest.length > 0) {
      groups.push({ id: "built-in", label: "Built-in", items: rest });
    }
    return groups;
  }, [builtins, configuredIds]);

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full">
          <Plus />
          Add provider
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        className="max-h-80 w-72 overflow-y-auto"
      >
        {builtins && groups.length === 0 ? (
          <div className="text-muted-foreground px-2 py-1.5 text-xs">
            No providers available
          </div>
        ) : (
          groups.map((group, index) => (
            <Fragment key={group.id}>
              {index > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="flex items-center gap-1">
                {group.label}
              </DropdownMenuLabel>
              {group.items.map((provider) => (
                <DropdownMenuItem
                  key={provider.id}
                  onSelect={() => void addProvider(provider.id)}
                >
                  <ProviderAvatar id={provider.id} name={provider.name} />
                  <span className="line-clamp-1 grow">{provider.name}</span>
                  {provider.websiteURL && (
                    <Link
                      href={provider.websiteURL}
                      aria-label={`Open ${provider.name} website`}
                      className="text-muted-foreground/80 hover:text-foreground shrink-0"
                      onClick={(event) => event.stopPropagation()}
                      onMouseDown={(event) => event.stopPropagation()}
                      onPointerDown={(event) => event.stopPropagation()}
                    >
                      <ExternalLink className="size-2.5" />
                    </Link>
                  )}
                </DropdownMenuItem>
              ))}
            </Fragment>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProviderListItem({
  provider,
  selected,
  onSelect,
}: {
  provider: ModelProviderGroup;
  selected: boolean;
  onSelect: () => void;
}) {
  const removeProvider = useRemoveProvider();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "group flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition-colors",
        selected ? "bg-muted font-medium" : "hover:bg-muted/50"
      )}
    >
      <ProviderAvatar id={provider.id} name={provider.name} />
      <span className="line-clamp-1 grow">{provider.name}</span>

      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <span
            role="button"
            tabIndex={0}
            aria-label="Provider actions"
            title="Provider actions"
            className={cn(
              "text-muted-foreground hover:bg-accent hover:text-foreground inline-flex size-5 shrink-0 items-center justify-center rounded transition-opacity",
              menuOpen
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-4" />
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setConfirmOpen(true)}
          >
            <Trash2 />
            Remove {provider.name}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Remove ${provider.name}?`}
        description={`This removes ${provider.name} from your configured providers. You can add it back later.`}
        confirmLabel="Remove"
        onConfirm={() => {
          setConfirmOpen(false);
          void removeProvider(provider.id);
        }}
      />
    </div>
  );
}

function ProviderEditor({ provider }: { provider: ModelProviderGroup | null }) {
  const updateProvider = useUpdateProvider();
  const [apiKeyEnabled, setApiKeyEnabled] = useState(Boolean(provider?.apiKey));
  const [apiKeyVisible, setApiKeyVisible] = useState(false);

  // Toggling the switch off clears the stored key immediately; toggling on just
  // reveals the input and waits for the user to type a value.
  const handleApiKeyToggle = (enabled: boolean) => {
    setApiKeyEnabled(enabled);
    if (!enabled && provider) {
      void updateProvider(provider.id, { apiKey: null });
    }
  };

  // Persist on blur, but only when the value actually changed. An empty field
  // clears the key (stored as `null`).
  const handleApiKeyBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    if (!provider) return;
    const value = event.target.value.trim();
    const next = value === "" ? null : value;
    const current = provider.apiKey ?? null;
    if (next !== current) {
      void updateProvider(provider.id, { apiKey: next });
    }
  };

  if (!provider) {
    return (
      <div className="text-muted-foreground flex min-w-0 grow items-center justify-center text-sm">
        Select or add a provider from the left sidebar
      </div>
    );
  }

  return (
    <div className="flex min-w-0 grow flex-col">
      <ScrollArea className="min-h-0 grow">
        <div className="flex flex-col gap-6 pl-6">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-lg font-medium">
              {provider.name}
            </h3>
            {provider.websiteLink ? (
              <Tooltip content={`Learn more about ${provider.name}`}>
                <Link
                  href={provider.websiteLink}
                  aria-label={`Open ${provider.name} website`}
                >
                  <ExternalLink className="text-muted-foreground hover:text-foreground size-4 transition-colors" />
                </Link>
              </Tooltip>
            ) : null}
          </div>

          {provider.id !== "openai-codex" && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Use custom API key
                </label>
                <Switch
                  checked={apiKeyEnabled}
                  onCheckedChange={handleApiKeyToggle}
                />
              </div>
              {apiKeyEnabled && (
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <Input
                      type={apiKeyVisible ? "text" : "password"}
                      defaultValue={provider.apiKey ?? ""}
                      placeholder={`Input API Key for ${provider.name}.`}
                      className="pr-9"
                      onBlur={handleApiKeyBlur}
                    />
                    <button
                      type="button"
                      onClick={() => setApiKeyVisible((visible) => !visible)}
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 transition-colors"
                      aria-label={
                        apiKeyVisible ? "Hide API key" : "Show API key"
                      }
                    >
                      {apiKeyVisible ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {
                      'Use "${ENV_NAME}" to reference environment variables. e.g. "$OPENAI_API_KEY"'
                    }
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Models</span>
              <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                {provider.models.length}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {provider.models.map((model) => (
                <Item key={model.id} variant="muted" size="sm">
                  <ItemMedia>
                    <ModelAvatar id={model.id} name={model.name} />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="font-mono">{model.name}</ItemTitle>
                  </ItemContent>
                </Item>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
