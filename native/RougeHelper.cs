using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Automation;

public static class RougeHelper
{
    [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr h);
    [DllImport("user32.dll")] static extern bool IsWindow(IntPtr h);
    [DllImport("user32.dll")] static extern bool AttachThreadInput(uint a, uint b, bool attach);
    [DllImport("user32.dll")] static extern bool BringWindowToTop(IntPtr h);
    [DllImport("kernel32.dll")] static extern uint GetCurrentThreadId();
    [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
    [DllImport("user32.dll")] static extern short GetAsyncKeyState(int k);
    [DllImport("user32.dll")] static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr extra);
    [DllImport("user32.dll")] static extern IntPtr SetWindowsHookEx(int id, HookProc cb, IntPtr mod, uint tid);
    [DllImport("user32.dll")] static extern IntPtr CallNextHookEx(IntPtr h, int n, IntPtr w, IntPtr l);
    [DllImport("user32.dll")] static extern int GetMessage(out MSG m, IntPtr h, uint a, uint b);
    [DllImport("kernel32.dll")] static extern IntPtr GetModuleHandle(string n);
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode)] static extern bool QueryFullProcessImageName(IntPtr h, int f, StringBuilder s, ref int n);
    [DllImport("kernel32.dll")] static extern IntPtr OpenProcess(uint a, bool i, uint pid);
    [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr h);
    [DllImport("user32.dll")] static extern uint GetClipboardSequenceNumber();
    [DllImport("user32.dll")] static extern bool IsClipboardFormatAvailable(uint f);
    [DllImport("user32.dll")] static extern bool OpenClipboard(IntPtr h);
    [DllImport("user32.dll")] static extern bool CloseClipboard();
    [DllImport("user32.dll")] static extern IntPtr GetClipboardData(uint f);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern uint RegisterClipboardFormat(string name);
    [DllImport("shell32.dll", CharSet = CharSet.Unicode)] static extern uint DragQueryFile(IntPtr h, uint i, StringBuilder s, uint n);
    [DllImport("kernel32.dll")] static extern IntPtr GlobalLock(IntPtr h);
    [DllImport("kernel32.dll")] static extern bool GlobalUnlock(IntPtr h);
    [DllImport("kernel32.dll")] static extern UIntPtr GlobalSize(IntPtr h);
    [DllImport("shell32.dll", CharSet = CharSet.Unicode)] static extern IntPtr SHGetFileInfo(string path, uint attrs, ref SHFILEINFO info, uint size, uint flags);
    [DllImport("shell32.dll", CharSet = CharSet.Unicode)] static extern int SHDefExtractIcon(string location, int index, uint flags, out IntPtr large, out IntPtr small, uint size);
    [DllImport("user32.dll")] static extern bool DestroyIcon(IntPtr h);
    [DllImport("shell32.dll", EntryPoint = "#727")] static extern int SHGetImageList(int list, ref Guid iid, out IImageList ppv);
    [DllImport("shlwapi.dll", CharSet = CharSet.Unicode)] static extern int AssocQueryString(uint flags, uint str, string assoc, string extra, StringBuilder outStr, ref uint len);

    [ComImport, Guid("46EB5926-582E-4017-9FDF-E8998DAA0950"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IImageList
    {
        [PreserveSig] int Add(IntPtr a, IntPtr b, ref int c);
        [PreserveSig] int ReplaceIcon(int i, IntPtr h, ref int pi);
        [PreserveSig] int SetOverlayImage(int a, int b);
        [PreserveSig] int Replace(int i, IntPtr a, IntPtr b);
        [PreserveSig] int AddMasked(IntPtr a, int c, ref int pi);
        [PreserveSig] int Draw(IntPtr p);
        [PreserveSig] int Remove(int i);
        [PreserveSig] int GetIcon(int i, int flags, ref IntPtr icon);
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    struct SHFILEINFO
    {
        public IntPtr hIcon; public int iIcon; public uint attrs;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 260)] public string name;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 80)] public string type;
    }

    [StructLayout(LayoutKind.Sequential)] public struct MSG { public IntPtr h; public uint m; public IntPtr w; public IntPtr l; public uint t; public int x; public int y; }
    [StructLayout(LayoutKind.Sequential)] struct MSLL { public int x; public int y; public uint data; public uint flags; public uint time; public IntPtr extra; }
    delegate IntPtr HookProc(int n, IntPtr w, IntPtr l);

    const byte VK_ALT = 0x12, VK_CTRL = 0x11, VK_MASK = 0xE8, KEYUP = 2;
    static HookProc mouseProc, keyProc;
    static IntPtr mouseHook, keyHook;
    static bool masked;
    public static volatile bool KeysOn;
    static readonly object outLock = new object();

    static bool AltDown() { return (GetAsyncKeyState(VK_ALT) & 0x8000) != 0; }
    static void Tap(byte vk) { keybd_event(vk, 0, 0, UIntPtr.Zero); keybd_event(vk, 0, KEYUP, UIntPtr.Zero); }

    public static void Emit(string s) { lock (outLock) { Console.Out.WriteLine(s); Console.Out.Flush(); } }

    static string Esc(string s)
    {
        if (s == null) return "";
        var b = new StringBuilder();
        foreach (char c in s)
        {
            if (c == '"' || c == '\\') b.Append('\\').Append(c);
            else if (c < 32) b.Append(' ');
            else b.Append(c);
        }
        return b.ToString();
    }

    static IntPtr MouseCb(int n, IntPtr w, IntPtr l)
    {
        if (n >= 0)
        {
            int msg = (int)w;
            bool alt = AltDown();
            if (!alt) masked = false;
            if (msg == 0x020A && alt)
            {
                var d = (MSLL)Marshal.PtrToStructure(l, typeof(MSLL));
                short delta = (short)(d.data >> 16);

                if (!masked) { Tap(VK_MASK); masked = true; }
                Emit("{\"type\":\"wheel\",\"delta\":" + delta + "}");
                return (IntPtr)1;
            }
            if (KeysOn && (msg == 0x0201 || msg == 0x0204 || msg == 0x0207))
            {
                var d = (MSLL)Marshal.PtrToStructure(l, typeof(MSLL));
                Emit("{\"type\":\"click\",\"x\":" + d.x + ",\"y\":" + d.y + "}");
            }
        }
        return CallNextHookEx(mouseHook, n, w, l);
    }

    static bool MenuKey(int vk) { return vk == 0x26 || vk == 0x28 || vk == 0x0D || vk == 0x1B || (vk >= 0x31 && vk <= 0x39); }

    static IntPtr KeyCb(int n, IntPtr w, IntPtr l)
    {
        if (n >= 0 && KeysOn)
        {
            int msg = (int)w, vk = Marshal.ReadInt32(l);
            if (MenuKey(vk))
            {
                if (msg == 0x100 || msg == 0x104) Emit("{\"type\":\"key\",\"vk\":" + vk + "}");
                return (IntPtr)1;
            }
        }
        return CallNextHookEx(keyHook, n, w, l);
    }

    static void StartHooks()
    {
        var t = new Thread(() =>
        {
            mouseProc = MouseCb; keyProc = KeyCb;
            IntPtr mod = GetModuleHandle(null);
            mouseHook = SetWindowsHookEx(14, mouseProc, mod, 0);
            keyHook = SetWindowsHookEx(13, keyProc, mod, 0);
            MSG m;
            while (GetMessage(out m, IntPtr.Zero, 0, 0) > 0) { }
        });
        t.IsBackground = true;
        t.Start();
    }

    static readonly string[] Browsers = { "chrome", "msedge", "brave", "vivaldi", "opera", "firefox", "arc", "thorium", "chromium", "zen", "librewolf", "waterfox" };

    static string Url(IntPtr h)
    {
        try
        {
            var root = AutomationElement.FromHandle(h);
            var el = root.FindFirst(TreeScope.Descendants, new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.Edit));
            object p;
            if (el != null && el.TryGetCurrentPattern(ValuePattern.Pattern, out p)) return ((ValuePattern)p).Current.Value;
        }
        catch { }
        return "";
    }

    static string Foreground()
    {
        IntPtr h = GetForegroundWindow();
        uint pid;
        GetWindowThreadProcessId(h, out pid);
        var title = new StringBuilder(512);
        GetWindowText(h, title, 512);
        string exe = "";
        IntPtr ph = OpenProcess(0x1000, false, pid);
        if (ph != IntPtr.Zero)
        {
            var eb = new StringBuilder(1024);
            int n = 1024;
            if (QueryFullProcessImageName(ph, 0, eb, ref n)) exe = eb.ToString();
            CloseHandle(ph);
        }
        string name = "";
        try { name = FileVersionInfo.GetVersionInfo(exe).FileDescription; } catch { }
        string url = "";
        string baseName = "";
        try { baseName = System.IO.Path.GetFileNameWithoutExtension(exe).ToLowerInvariant(); } catch { }
        if (Array.IndexOf(Browsers, baseName) >= 0) url = Url(h);
        return "{\"hwnd\":" + h.ToInt64() + ",\"exe\":\"" + Esc(exe) + "\",\"name\":\"" + Esc(name) +
               "\",\"title\":\"" + Esc(title.ToString()) + "\",\"url\":\"" + Esc(url) + "\"}";
    }

    static void Activate(IntPtr h)
    {
        if (!IsWindow(h)) return;
        uint pid;
        uint fgThread = GetWindowThreadProcessId(GetForegroundWindow(), out pid);
        uint me = GetCurrentThreadId();
        bool attached = fgThread != 0 && fgThread != me && AttachThreadInput(me, fgThread, true);
        Tap(VK_MASK);
        BringWindowToTop(h);
        SetForegroundWindow(h);
        if (attached) AttachThreadInput(me, fgThread, false);
    }

    static void Paste()
    {
        if (AltDown()) { Tap(VK_MASK); keybd_event(VK_ALT, 0, KEYUP, UIntPtr.Zero); }
        keybd_event(VK_CTRL, 0, 0, UIntPtr.Zero);
        Tap(0x56);
        keybd_event(VK_CTRL, 0, KEYUP, UIntPtr.Zero);
    }

    const uint CF_HDROP = 15;
    const int MAX_FILES = 2000;
    static uint cfEffect;

    static string ReadClip(uint seq, bool init)
    {
        string head = "{\"type\":\"clip\",\"seq\":" + seq + ",\"init\":" + (init ? "true" : "false");
        if (!IsClipboardFormatAvailable(CF_HDROP)) return head + ",\"files\":null}";
        bool open = false;
        for (int i = 0; i < 6 && !(open = OpenClipboard(IntPtr.Zero)); i++) Thread.Sleep(15);
        if (!open) return null;
        var sb = new StringBuilder();
        int effect = 0;
        try
        {
            IntPtr h = GetClipboardData(CF_HDROP);
            if (h == IntPtr.Zero) return head + ",\"files\":null}";
            uint total = DragQueryFile(h, 0xFFFFFFFF, null, 0);
            uint n = Math.Min(total, (uint)MAX_FILES);
            var name = new StringBuilder(32768);
            sb.Append(",\"files\":[");
            for (uint i = 0; i < n; i++)
            {
                name.Length = 0;
                DragQueryFile(h, i, name, (uint)name.Capacity);
                if (i > 0) sb.Append(',');
                sb.Append('"').Append(Esc(name.ToString())).Append('"');
            }
            sb.Append("],\"total\":").Append(total);
            if (cfEffect != 0 && IsClipboardFormatAvailable(cfEffect))
            {
                IntPtr e = GetClipboardData(cfEffect);
                IntPtr p = e == IntPtr.Zero ? IntPtr.Zero : GlobalLock(e);
                if (p != IntPtr.Zero)
                {
                    try { if ((ulong)GlobalSize(e) >= 4) effect = Marshal.ReadInt32(p); }
                    finally { GlobalUnlock(e); }
                }
            }
        }
        finally { CloseClipboard(); }
        return head + sb.ToString() + ",\"effect\":" + effect + "}";
    }

    static void WatchClipboard()
    {
        var t = new Thread(() =>
        {
            cfEffect = RegisterClipboardFormat("Preferred DropEffect");
            uint last = 0;
            bool first = true;
            while (true)
            {
                try
                {
                    uint seq = GetClipboardSequenceNumber();
                    if (first || seq != last)
                    {
                        if (!first) Thread.Sleep(70);
                        uint settled = GetClipboardSequenceNumber();
                        if (first || settled == seq)
                        {
                            string json = ReadClip(settled, first);
                            if (json != null) { Emit(json); last = settled; first = false; }
                        }
                    }
                }
                catch (Exception e) { Emit("{\"type\":\"error\",\"msg\":\"clip " + Esc(e.Message) + "\"}"); }
                Thread.Sleep(150);
            }
        });
        t.IsBackground = true;
        t.Start();
    }

    static bool SetFiles(string[] paths, int effect)
    {
        bool ok = false;
        string err = null;
        var t = new Thread(() =>
        {
            try
            {
                var list = new System.Collections.Specialized.StringCollection();
                list.AddRange(paths);
                var data = new System.Windows.Forms.DataObject();
                data.SetFileDropList(list);
                data.SetData("Preferred DropEffect", new System.IO.MemoryStream(BitConverter.GetBytes(effect)));
                System.Windows.Forms.Clipboard.SetDataObject(data, true, 10, 40);
                ok = true;
            }
            catch (Exception e) { err = e.Message; }
        });
        t.SetApartmentState(ApartmentState.STA);
        t.IsBackground = true;
        t.Start();
        if (!t.Join(5000)) err = "timed out";
        if (err != null) Emit("{\"type\":\"error\",\"msg\":\"setfiles " + Esc(err) + "\"}");
        return ok;
    }

    // the icon windows itself shows for a file type (or a specific file), as a png, plus where it came from
    static IImageList bigIcons;
    static string FileIcon(string id, bool byExt, string arg, int size)
    {
        string target = byExt ? "x" + arg : arg;
        uint attrs = byExt ? 0x80u : 0u, useAttrs = byExt ? 0x10u : 0u;
        var info = new SHFILEINFO();
        string loc = "";
        if (byExt)
        {
            var sb = new StringBuilder(1024);
            uint len = 1024;
            if (AssocQueryString(0, 15, arg, null, sb, ref len) == 0) loc = sb.ToString();
        }
        IntPtr h = IntPtr.Zero;
        if (SHGetFileInfo(target, attrs, ref info, (uint)Marshal.SizeOf(info), 0x4000u | useAttrs) != IntPtr.Zero)
        {
            if (bigIcons == null) { var iid = new Guid("46EB5926-582E-4017-9FDF-E8998DAA0950"); SHGetImageList(2, ref iid, out bigIcons); }
            if (bigIcons != null) bigIcons.GetIcon(info.iIcon, 1, ref h);
        }
        if (h == IntPtr.Zero)
        {
            info = new SHFILEINFO();
            if (SHGetFileInfo(target, attrs, ref info, (uint)Marshal.SizeOf(info), 0x100u | useAttrs) != IntPtr.Zero) h = info.hIcon;
        }
        if (h == IntPtr.Zero) return "{\"type\":\"icon\",\"id\":" + id + ",\"png\":null}";
        string png;
        try
        {
            using (var ic = System.Drawing.Icon.FromHandle(h))
            using (var bmp = ic.ToBitmap())
            using (var ms = new System.IO.MemoryStream())
            {
                bmp.Save(ms, System.Drawing.Imaging.ImageFormat.Png);
                png = Convert.ToBase64String(ms.ToArray());
            }
        }
        finally { DestroyIcon(h); }
        return "{\"type\":\"icon\",\"id\":" + id + ",\"png\":\"" + png + "\",\"loc\":\"" + Esc(loc) + "\"}";
    }

    public static void Run()
    {
        StartHooks();
        WatchClipboard();
        Emit("{\"type\":\"ready\"}");
        string line;
        while ((line = Console.In.ReadLine()) != null)
        {
            var parts = line.Trim().Split(' ');
            try
            {
                switch (parts[0])
                {
                    case "fg": Emit("{\"type\":\"fg\",\"id\":" + parts[1] + ",\"info\":" + Foreground() + "}"); break;
                    case "keys": KeysOn = parts.Length > 1 && parts[1] == "1"; break;
                    case "paste": Paste(); break;
                    case "activate": Activate(new IntPtr(long.Parse(parts[1]))); break;
                    case "icon":
                        {
                            var p = line.TrimEnd('\r', '\n').Split(new[] { ' ' }, 4);
                            if (p.Length == 4) Emit(FileIcon(long.Parse(p[1]).ToString(), p[2] == "e", p[3], 64));
                            break;
                        }
                    case "setfiles":
                        {
                            var p = line.TrimEnd('\r', '\n').Split(new[] { ' ' }, 4);
                            bool ok = p.Length == 4 && SetFiles(p[3].Split(new[] { '|' }, StringSplitOptions.RemoveEmptyEntries), int.Parse(p[2]));
                            Emit("{\"type\":\"setfiles\",\"id\":" + long.Parse(p[1]) + ",\"ok\":" + (ok ? "true" : "false") + "}");
                            break;
                        }
                }
            }
            catch (Exception e) { Emit("{\"type\":\"error\",\"msg\":\"" + Esc(e.Message) + "\"}"); }
        }
    }
}
