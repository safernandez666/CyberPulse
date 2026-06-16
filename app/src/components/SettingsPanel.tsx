import { useState, useEffect, useCallback } from 'react';
import { Settings as SettingsIcon, Save, KeyRound, Bot, Link, Trash2, Plus, Rss, Shield, Linkedin, Unlink, CheckCircle2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getSettings, saveSettings, type Settings as SettingsState, DEFAULT_SETTINGS } from '@/lib/settings';
import {
  fetchApiSources, createSource, deleteSource, type SourceInfo,
  getLinkedInConfig, saveLinkedInConfig, deleteLinkedInConfig,
  getLinkedInStatus, getLinkedInAuthUrl, disconnectLinkedIn,
  type LinkedInStatus,
} from '@/services/apiService';

export interface SettingsPanelProps {
  className?: string;
  onSourcesChanged?: () => void;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
}

export default function SettingsPanel({ className, onSourcesChanged }: SettingsPanelProps) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<SettingsState>({ ...DEFAULT_SETTINGS });
  const [saved, setSaved] = useState(false);

  const [sources, setSources] = useState<SourceInfo[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const [newSource, setNewSource] = useState({ name: '', rssUrl: '', category: '' });
  const [adding, setAdding] = useState(false);

  const [linkedinConfigured, setLinkedinConfigured] = useState(false);
  const [linkedinStatus, setLinkedinStatus] = useState<LinkedInStatus | null>(null);
  const [linkedinForm, setLinkedinForm] = useState({ clientId: '', clientSecret: '', redirectUri: 'http://localhost:3001/api/linkedin/callback' });
  const [linkedinLoading, setLinkedinLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSettings(getSettings());
      setSaved(false);
      setToast(null);
      loadSources();
      loadLinkedIn();
    }
  }, [open]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.data && event.data.type === 'linkedin-oauth') {
        if (event.data.success) {
          showToast('LinkedIn account connected', 'success');
        } else {
          showToast('LinkedIn connection failed', 'error');
        }
        loadLinkedIn();
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const loadLinkedIn = useCallback(async () => {
    try {
      setLinkedinLoading(true);
      const [config, status] = await Promise.all([getLinkedInConfig(), getLinkedInStatus()]);
      setLinkedinConfigured(config.configured);
      setLinkedinStatus(status);
    } catch (err: any) {
      console.error('[Settings] Failed to load LinkedIn status:', err);
    } finally {
      setLinkedinLoading(false);
    }
  }, []);

  const handleSaveLinkedInConfig = async () => {
    if (!linkedinForm.clientId.trim() || !linkedinForm.clientSecret.trim()) {
      showToast('Client ID and Client Secret are required', 'error');
      return;
    }
    try {
      setLinkedinLoading(true);
      await saveLinkedInConfig({
        clientId: linkedinForm.clientId.trim(),
        clientSecret: linkedinForm.clientSecret.trim(),
        redirectUri: linkedinForm.redirectUri.trim() || 'http://localhost:3001/api/linkedin/callback',
      });
      setLinkedinForm({ clientId: '', clientSecret: '', redirectUri: 'http://localhost:3001/api/linkedin/callback' });
      showToast('LinkedIn app configured', 'success');
      await loadLinkedIn();
    } catch (err: any) {
      showToast(err?.message || 'Failed to save LinkedIn config', 'error');
    } finally {
      setLinkedinLoading(false);
    }
  };

  const handleConnectLinkedIn = async () => {
    try {
      const { url } = await getLinkedInAuthUrl();
      window.open(url, 'linkedin-oauth', 'width=600,height=700,top=100,left=100');
    } catch (err: any) {
      showToast(err?.message || 'Failed to start LinkedIn OAuth', 'error');
    }
  };

  const handleDisconnectLinkedIn = async () => {
    try {
      setLinkedinLoading(true);
      await disconnectLinkedIn();
      showToast('LinkedIn account disconnected', 'success');
      await loadLinkedIn();
    } catch (err: any) {
      showToast(err?.message || 'Failed to disconnect LinkedIn', 'error');
    } finally {
      setLinkedinLoading(false);
    }
  };

  const handleDeleteLinkedInConfig = async () => {
    try {
      setLinkedinLoading(true);
      await deleteLinkedInConfig();
      showToast('LinkedIn configuration removed', 'success');
      await loadLinkedIn();
    } catch (err: any) {
      showToast(err?.message || 'Failed to remove LinkedIn config', 'error');
    } finally {
      setLinkedinLoading(false);
    }
  };

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadSources = useCallback(async () => {
    setLoadingSources(true);
    try {
      const data = await fetchApiSources();
      setSources(data);
    } catch (err) {
      console.error('[Settings] Failed to load sources:', err);
      showToast('Failed to load sources', 'error');
    } finally {
      setLoadingSources(false);
    }
  }, [showToast]);

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    const t = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(t);
  };

  const update = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleAddSource = async () => {
    if (!newSource.name.trim() || !newSource.rssUrl.trim() || !newSource.category.trim()) {
      showToast('Please fill in all source fields', 'error');
      return;
    }
    setAdding(true);
    try {
      await createSource({
        name: newSource.name.trim(),
        rssUrl: newSource.rssUrl.trim(),
        category: newSource.category.trim(),
      });
      setNewSource({ name: '', rssUrl: '', category: '' });
      showToast('Source added successfully', 'success');
      await loadSources();
      onSourcesChanged?.();
    } catch (err: any) {
      showToast(err?.message || 'Failed to add source', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteSource = async (id: string) => {
    try {
      await deleteSource(id);
      showToast('Source deleted', 'success');
      await loadSources();
      onSourcesChanged?.();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete source', 'error');
    }
  };

  const customSources = sources.filter((s) => s.custom);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className={`
            p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated
            transition-colors cursor-pointer
            ${className ?? ''}
          `}
          aria-label="Open settings"
        >
          <SettingsIcon size={20} />
        </button>
      </SheetTrigger>
      <SheetContent
        className="bg-bg-primary border-l border-border-default w-3/4 sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle className="text-text-primary font-inter text-lg">Settings</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-6 overflow-y-auto">
          {toast && (
            <div
              className={`
                px-3 py-2 rounded-md text-sm font-inter
                ${toast.type === 'success' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'}
              `}
            >
              {toast.message}
            </div>
          )}

          <Card className="bg-bg-card border-border-default shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-text-primary font-inter text-base flex items-center gap-2">
                <Bot size={18} className="text-accent" />
                AI Provider
              </CardTitle>
              <CardDescription className="text-text-tertiary font-inter text-xs">
                Configure your OpenAI-compatible provider. Posts will be generated by AI when a key is present.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ai-api-key" className="text-text-secondary text-xs font-jetbrains uppercase tracking-[0.08em]">
                  <KeyRound size={12} className="inline mr-1.5" />
                  API Key
                </Label>
                <Input
                  id="ai-api-key"
                  type="password"
                  placeholder="sk-..."
                  value={settings.apiKey}
                  onChange={(e) => update('apiKey', e.target.value)}
                  className="bg-bg-input border-border-default text-text-primary placeholder:text-text-tertiary font-inter text-sm rounded-input h-10 focus:border-accent focus:ring-accent-glow"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-model" className="text-text-secondary text-xs font-jetbrains uppercase tracking-[0.08em]">
                  <Bot size={12} className="inline mr-1.5" />
                  Model
                </Label>
                <Input
                  id="ai-model"
                  type="text"
                  placeholder="gpt-4o-mini"
                  value={settings.model}
                  onChange={(e) => update('model', e.target.value)}
                  className="bg-bg-input border-border-default text-text-primary placeholder:text-text-tertiary font-inter text-sm rounded-input h-10 focus:border-accent focus:ring-accent-glow"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-base-url" className="text-text-secondary text-xs font-jetbrains uppercase tracking-[0.08em]">
                  <Link size={12} className="inline mr-1.5" />
                  Base URL
                </Label>
                <Input
                  id="ai-base-url"
                  type="text"
                  placeholder="https://api.openai.com/v1"
                  value={settings.baseUrl}
                  onChange={(e) => update('baseUrl', e.target.value)}
                  className="bg-bg-input border-border-default text-text-primary placeholder:text-text-tertiary font-inter text-sm rounded-input h-10 focus:border-accent focus:ring-accent-glow"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-bg-card border-border-default shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-text-primary font-inter text-base flex items-center gap-2">
                <Shield size={18} className="text-accent" />
                CyberPulse API Key
              </CardTitle>
              <CardDescription className="text-text-tertiary font-inter text-xs">
                Required for protected endpoints like adding custom RSS sources or triggering scrapes. Leave empty if the server has no key configured.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cyberpulse-api-key" className="text-text-secondary text-xs font-jetbrains uppercase tracking-[0.08em]">
                  <KeyRound size={12} className="inline mr-1.5" />
                  API Key
                </Label>
                <Input
                  id="cyberpulse-api-key"
                  type="password"
                  placeholder="cp-..."
                  value={settings.cyberpulseApiKey}
                  onChange={(e) => update('cyberpulseApiKey', e.target.value)}
                  className="bg-bg-input border-border-default text-text-primary placeholder:text-text-tertiary font-inter text-sm rounded-input h-10 focus:border-accent focus:ring-accent-glow"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-bg-card border-border-default shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-text-primary font-inter text-base flex items-center gap-2">
                <Rss size={18} className="text-accent" />
                Custom RSS Sources
              </CardTitle>
              <CardDescription className="text-text-tertiary font-inter text-xs">
                Add your own RSS feeds. Built-in sources cannot be deleted from here.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-text-secondary text-xs font-jetbrains uppercase tracking-[0.08em]">Name</Label>
                  <Input
                    type="text"
                    placeholder="e.g. My Security Blog"
                    value={newSource.name}
                    onChange={(e) => setNewSource((prev) => ({ ...prev, name: e.target.value }))}
                    className="bg-bg-input border-border-default text-text-primary placeholder:text-text-tertiary font-inter text-sm rounded-input h-10 focus:border-accent focus:ring-accent-glow"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-text-secondary text-xs font-jetbrains uppercase tracking-[0.08em]">RSS URL</Label>
                  <Input
                    type="text"
                    placeholder="https://example.com/feed.xml"
                    value={newSource.rssUrl}
                    onChange={(e) => setNewSource((prev) => ({ ...prev, rssUrl: e.target.value }))}
                    className="bg-bg-input border-border-default text-text-primary placeholder:text-text-tertiary font-inter text-sm rounded-input h-10 focus:border-accent focus:ring-accent-glow"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-text-secondary text-xs font-jetbrains uppercase tracking-[0.08em]">Category</Label>
                  <Input
                    type="text"
                    placeholder="e.g. THREAT INTEL"
                    value={newSource.category}
                    onChange={(e) => setNewSource((prev) => ({ ...prev, category: e.target.value }))}
                    className="bg-bg-input border-border-default text-text-primary placeholder:text-text-tertiary font-inter text-sm rounded-input h-10 focus:border-accent focus:ring-accent-glow"
                  />
                </div>
                <Button
                  onClick={handleAddSource}
                  disabled={adding}
                  className="w-full bg-accent text-text-inverse hover:brightness-110 font-inter text-sm font-semibold rounded-button h-10"
                >
                  {adding ? (
                    'Adding...'
                  ) : (
                    <>
                      <Plus size={16} />
                      Add Source
                    </>
                  )}
                </Button>
              </div>

              <div className="border-t border-border-default pt-3">
                <p className="text-text-secondary text-xs font-jetbrains uppercase tracking-[0.08em] mb-2">
                  Existing custom sources
                </p>
                {loadingSources ? (
                  <p className="text-text-tertiary text-sm font-inter">Loading...</p>
                ) : customSources.length === 0 ? (
                  <p className="text-text-tertiary text-sm font-inter">No custom sources yet.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {customSources.map((source) => (
                      <div
                        key={source.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-md bg-bg-elevated border border-border-default"
                      >
                        <div className="min-w-0">
                          <p className="text-text-primary text-sm font-inter truncate">{source.name}</p>
                          <p className="text-text-tertiary text-xs font-jetbrains uppercase">{source.category}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSource(source.id)}
                          className="p-1.5 rounded-md text-text-tertiary hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                          aria-label={`Delete ${source.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-bg-card border-border-default shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-text-primary font-inter text-base flex items-center gap-2">
                <Linkedin size={18} className="text-accent" />
                LinkedIn Account
              </CardTitle>
              <CardDescription className="text-text-tertiary font-inter text-xs">
                Publish generated posts directly to your LinkedIn profile. Requires a LinkedIn Developer App with Share on LinkedIn enabled.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {linkedinLoading ? (
                <p className="text-text-tertiary text-sm font-inter">Loading LinkedIn status...</p>
              ) : !linkedinConfigured ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-text-secondary text-xs font-jetbrains uppercase tracking-[0.08em]">Client ID</Label>
                    <Input
                      type="text"
                      placeholder="LinkedIn Client ID"
                      value={linkedinForm.clientId}
                      onChange={(e) => setLinkedinForm((prev) => ({ ...prev, clientId: e.target.value }))}
                      className="bg-bg-input border-border-default text-text-primary placeholder:text-text-tertiary font-inter text-sm rounded-input h-10 focus:border-accent focus:ring-accent-glow"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-text-secondary text-xs font-jetbrains uppercase tracking-[0.08em]">Client Secret</Label>
                    <Input
                      type="password"
                      placeholder="LinkedIn Client Secret"
                      value={linkedinForm.clientSecret}
                      onChange={(e) => setLinkedinForm((prev) => ({ ...prev, clientSecret: e.target.value }))}
                      className="bg-bg-input border-border-default text-text-primary placeholder:text-text-tertiary font-inter text-sm rounded-input h-10 focus:border-accent focus:ring-accent-glow"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-text-secondary text-xs font-jetbrains uppercase tracking-[0.08em]">Redirect URI</Label>
                    <Input
                      type="text"
                      placeholder="http://localhost:3001/api/linkedin/callback"
                      value={linkedinForm.redirectUri}
                      onChange={(e) => setLinkedinForm((prev) => ({ ...prev, redirectUri: e.target.value }))}
                      className="bg-bg-input border-border-default text-text-primary placeholder:text-text-tertiary font-inter text-sm rounded-input h-10 focus:border-accent focus:ring-accent-glow"
                    />
                  </div>
                  <Button
                    onClick={handleSaveLinkedInConfig}
                    disabled={linkedinLoading}
                    className="w-full bg-accent text-text-inverse hover:brightness-110 font-inter text-sm font-semibold rounded-button h-10"
                  >
                    <Linkedin size={16} />
                    Save LinkedIn App
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-inter text-text-secondary">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    LinkedIn App configured
                  </div>

                  {linkedinStatus?.connected ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-inter text-text-secondary">
                        <CheckCircle2 size={16} className="text-emerald-400" />
                        Account connected
                        {linkedinStatus.personId && (
                          <span className="text-text-tertiary font-jetbrains text-xs">({linkedinStatus.personId.slice(0, 12)}...)</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleDisconnectLinkedIn}
                          disabled={linkedinLoading}
                          variant="outline"
                          className="flex-1 border-border-default text-text-secondary hover:text-text-primary hover:bg-bg-elevated font-inter text-sm rounded-button h-10"
                        >
                          <Unlink size={16} />
                          Disconnect Account
                        </Button>
                        <Button
                          onClick={handleDeleteLinkedInConfig}
                          disabled={linkedinLoading}
                          variant="outline"
                          className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 font-inter text-sm rounded-button h-10"
                        >
                          <Trash2 size={16} />
                          Remove App
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={handleConnectLinkedIn}
                      disabled={linkedinLoading}
                      className="w-full bg-accent text-text-inverse hover:brightness-110 font-inter text-sm font-semibold rounded-button h-10"
                    >
                      <Linkedin size={16} />
                      Connect LinkedIn Account
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            onClick={handleSave}
            className="w-full bg-accent text-text-inverse hover:brightness-110 font-inter text-sm font-semibold rounded-button h-10"
          >
            {saved ? (
              <>
                <Save size={16} />
                Saved
              </>
            ) : (
              <>
                <Save size={16} />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
