import * as React from "react"
import {
  Users,
  DollarSign,
  Activity,
  Layers,
  ArrowRight,
  Code,
  Moon,
  Sun,
  Plus,
  Trash,
  AlertCircle,
  HelpCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

// Custom CRM Components
import { StatusBadge } from "@/components/ui/status-badge"
import { StatCard } from "@/components/ui/stat-card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { DataTable } from "@/components/ui/data-table"
import { DatePicker } from "@/components/ui/date-picker"
import { PageHeader } from "@/components/ui/page-header"

// Theme
import { useTheme } from "@/hooks/useTheme"
import { THEME } from "@/lib/theme"

export default function StyleGuidePage() {
  const { theme, toggleTheme } = useTheme()
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState(null)

  // DataTable Mock Data
  const columns = [
    {
      accessorKey: "name",
      header: "Name",
      enableSorting: true,
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role")
        return (
          <span className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground capitalize">
            {role.replace("_", " ")}
          </span>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status")
        return <StatusBadge status={status} dot />
      },
    },
  ]

  const mockUsers = [
    { id: 1, name: "Sarah Connor", email: "sarah@cyberdyne.com", role: "super_admin", status: "active" },
    { id: 2, name: "John Connor", email: "john@resistance.net", role: "manager", status: "in_progress" },
    { id: 3, name: "T-800 Model", email: "terminator@cyberdyne.com", role: "developer", status: "pending" },
    { id: 4, name: "Marcus Wright", email: "marcus@projectangel.org", role: "qa_engineer", status: "review" },
    { id: 5, name: "Kyle Reese", email: "kyle@past.net", role: "client", status: "inactive" },
  ]

  const showToastSuccess = () => {
    toast.success("Action completed successfully!")
  }

  const showToastInfo = () => {
    toast.info("Here is some helpful information.")
  }

  const showToastError = () => {
    toast.error("An error occurred. Please try again.")
  }

  const handleConfirmAction = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        toast.success("Resource deleted successfully!")
        resolve()
      }, 1500)
    })
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Toast Notification Container */}
      <Toaster position="top-right" closeButton />

      {/* Style Guide Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              C
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">CRM UI Style Guide</h1>
              <p className="text-xs text-muted-foreground">Living Design System & Component Library</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={toggleTheme}>
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4 mr-2" /> Light Mode
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 mr-2" /> Dark Mode
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
              Sections
            </p>
            <a href="#typography" className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              1. Typography
            </a>
            <a href="#colours" className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              2. Colours
            </a>
            <a href="#buttons" className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              3. Buttons
            </a>
            <a href="#form-elements" className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              4. Form Elements
            </a>
            <a href="#badges" className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              5. Badges
            </a>
            <a href="#cards" className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              6. Cards
            </a>
            <a href="#feedback" className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              7. Feedback
            </a>
            <a href="#overlays" className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              8. Overlays
            </a>
            <a href="#data-table" className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              9. Data Table
            </a>
            <a href="#empty-state-header" className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              10. Empty State & Header
            </a>
          </div>
        </aside>

        {/* Content Area */}
        <main className="lg:col-span-3 space-y-16">
          {/* Section 1: Typography */}
          <section id="typography" className="scroll-mt-24 space-y-6">
            <h2 className="text-xl font-bold border-b border-border pb-2">1. Typography</h2>
            <Card className="p-6 space-y-6">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-mono">h1. Heading 1 (Page Title)</p>
                <h1 className="text-3xl font-extrabold tracking-tight">The quick brown fox jumps over the lazy dog</h1>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-mono">h2. Heading 2 (Section Title)</p>
                <h2 className="text-2xl font-bold tracking-tight">The quick brown fox jumps over the lazy dog</h2>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-mono">h3. Heading 3 (Card Title)</p>
                <h3 className="text-xl font-semibold tracking-tight">The quick brown fox jumps over the lazy dog</h3>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-mono">h4. Heading 4 (Sub-section Title)</p>
                <h4 className="text-lg font-medium tracking-tight">The quick brown fox jumps over the lazy dog</h4>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-mono">body. Paragraph Body Text</p>
                <p className="text-sm text-foreground leading-relaxed">
                  Antigravity CRM is built with state-of-the-art UI design methodologies. This design language provides maximum density, visual harmony, accessibility, and high performance for software houses managing developers, designers, client relations, tasks, leads, and invoicing.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-mono">muted. Muted Text</p>
                <p className="text-sm text-muted-foreground">
                  Last updated 5 minutes ago by Administrator.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-mono">code. Code Text</p>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-pink-600 dark:text-pink-400">
                  {'const systemConfig = { role: "super_admin", active: true };'}
                </code>
              </div>
            </Card>
          </section>

          {/* Section 2: Colours */}
          <section id="colours" className="scroll-mt-24 space-y-6">
            <h2 className="text-xl font-bold border-b border-border pb-2">2. Colours</h2>
            <Card className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <div className="h-16 rounded-lg bg-background border border-border flex items-end p-2">
                    <span className="text-[10px] font-semibold text-foreground">bg</span>
                  </div>
                  <p className="text-xs font-medium">Background</p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-lg bg-foreground flex items-end p-2">
                    <span className="text-[10px] font-semibold text-background">fg</span>
                  </div>
                  <p className="text-xs font-medium">Foreground</p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-lg bg-primary text-primary-foreground flex items-end p-2">
                    <span className="text-[10px] font-semibold">primary</span>
                  </div>
                  <p className="text-xs font-medium">Primary</p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-lg bg-secondary text-secondary-foreground flex items-end p-2 border border-border">
                    <span className="text-[10px] font-semibold">secondary</span>
                  </div>
                  <p className="text-xs font-medium">Secondary</p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-lg bg-muted text-muted-foreground flex items-end p-2 border border-border">
                    <span className="text-[10px] font-semibold">muted</span>
                  </div>
                  <p className="text-xs font-medium">Muted</p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-lg bg-accent text-accent-foreground flex items-end p-2 border border-border">
                    <span className="text-[10px] font-semibold">accent</span>
                  </div>
                  <p className="text-xs font-medium">Accent</p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-lg bg-destructive text-destructive-foreground flex items-end p-2">
                    <span className="text-[10px] font-semibold">destructive</span>
                  </div>
                  <p className="text-xs font-medium">Destructive</p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-lg border border-border flex items-end p-2 bg-card">
                    <span className="text-[10px] font-semibold">border</span>
                  </div>
                  <p className="text-xs font-medium">Border</p>
                </div>
                <div className="space-y-2">
                  <div className="h-16 rounded-lg border-2 border-ring flex items-end p-2">
                    <span className="text-[10px] font-semibold">ring</span>
                  </div>
                  <p className="text-xs font-medium">Ring</p>
                </div>
              </div>
            </Card>
          </section>

          {/* Section 3: Buttons */}
          <section id="buttons" className="scroll-mt-24 space-y-6">
            <h2 className="text-xl font-bold border-b border-border pb-2">3. Buttons</h2>
            <Card className="p-6 space-y-8">
              <div className="space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Variants</p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="default">Default Button</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="link">Link Style</Button>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sizes</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="xs" variant="outline">Size XS</Button>
                  <Button size="sm" variant="outline">Size SM</Button>
                  <Button size="default" variant="outline">Default Size</Button>
                  <Button size="lg" variant="outline">Size LG</Button>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Icon Combinations</p>
                <div className="flex flex-wrap gap-3">
                  <Button>
                    <Plus className="mr-1.5 h-4 w-4" /> Add Item
                  </Button>
                  <Button variant="secondary">
                    Next Section <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon">
                    <Trash className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon-sm">
                    <Code className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          </section>

          {/* Section 4: Form Elements */}
          <section id="form-elements" className="scroll-mt-24 space-y-6">
            <h2 className="text-xl font-bold border-b border-border pb-2">4. Form Elements</h2>
            <Card className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="styleguide-username" className="text-sm font-medium">Text Input</label>
                  <Input id="styleguide-username" placeholder="Enter username..." />
                </div>
                <div className="space-y-2">
                  <label htmlFor="styleguide-select" className="text-sm font-medium">Dropdown Select</label>
                  <Select defaultValue="medium">
                    <SelectTrigger id="styleguide-select">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="styleguide-description" className="text-sm font-medium">Textarea Field</label>
                <Textarea id="styleguide-description" placeholder="Write a short description..." rows={3} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Toggles & Checks</p>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="terms" />
                    <label htmlFor="terms" className="text-sm font-medium leading-none cursor-pointer">
                      Accept terms and conditions
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="airplane-mode" />
                    <label htmlFor="airplane-mode" className="text-sm font-medium leading-none cursor-pointer">
                      Enable push notifications
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Radio Groups</p>
                  <RadioGroup defaultValue="developer">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="developer" id="r1" />
                      <label htmlFor="r1" className="text-sm leading-none cursor-pointer">Developer</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="manager" id="r2" />
                      <label htmlFor="r2" className="text-sm leading-none cursor-pointer">Manager</label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-sm font-medium block">DatePicker</span>
                <DatePicker
                  date={selectedDate}
                  setDate={setSelectedDate}
                  placeholder="Choose deadline"
                />
              </div>
            </Card>
          </section>

          {/* Section 5: Badges */}
          <section id="badges" className="scroll-mt-24 space-y-6">
            <h2 className="text-xl font-bold border-b border-border pb-2">5. Badges</h2>
            <Card className="p-6 space-y-6">
              <div className="space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  CRM StatusBadges (Auto-mapped with Optional Dot)
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <StatusBadge status="active" dot />
                  <StatusBadge status="won" dot />
                  <StatusBadge status="completed" />
                  <StatusBadge status="paid" dot />
                  <StatusBadge status="in_progress" dot />
                  <StatusBadge status="contacted" />
                  <StatusBadge status="sent" dot />
                  <StatusBadge status="on_hold" dot />
                  <StatusBadge status="pending" />
                  <StatusBadge status="draft" dot />
                  <StatusBadge status="new" dot />
                  <StatusBadge status="todo" />
                  <StatusBadge status="lead" dot />
                  <StatusBadge status="review" dot />
                  <StatusBadge status="qualified" dot />
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Overdue / Critical Statuses (Animated Red Pulse)
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <StatusBadge status="overdue" dot />
                  <StatusBadge status="critical" dot />
                  <StatusBadge status="blocked" dot />
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Role Mappings (Standard Badges mapped from theme)
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {Object.entries(THEME.roleColors).map(([role, color]) => {
                    const mappedColors = {
                      purple: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800",
                      blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
                      teal: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-800",
                      green: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
                      pink: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/30 dark:text-pink-400 dark:border-pink-800",
                      orange: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800",
                      gray: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800",
                    }
                    const badgeClass = mappedColors[color] || mappedColors.gray

                    return (
                      <Badge key={role} variant="outline" className={badgeClass}>
                        {role.replace("_", " ")}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            </Card>
          </section>

          {/* Section 6: Cards */}
          <section id="cards" className="scroll-mt-24 space-y-6">
            <h2 className="text-xl font-bold border-b border-border pb-2">6. Cards</h2>
            <div className="space-y-6">
              {/* StatCards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                  title="Total Revenue"
                  value="$45,231.89"
                  change={12.5}
                  changeLabel="from last month"
                  icon={DollarSign}
                  color="green"
                />
                <StatCard
                  title="Active Leads"
                  value="1,240"
                  change={-3.2}
                  changeLabel="vs last week"
                  icon={Users}
                  color="blue"
                />
                <StatCard
                  title="System Load"
                  value="94%"
                  change={24}
                  changeLabel="critical spikes"
                  icon={Activity}
                  color="red"
                  className="border-rose-200 dark:border-rose-900"
                />
              </div>

              {/* Loading StatCard */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Loading Stats" value="0" loading />
                <StatCard
                  title="Review Queue"
                  value="18 Tasks"
                  change={0}
                  changeLabel="no changes"
                  icon={Layers}
                  color="purple"
                />
                <StatCard
                  title="Pending Invoices"
                  value="4 Drafts"
                  change={4.5}
                  changeLabel="accumulating"
                  icon={DollarSign}
                  color="amber"
                />
              </div>

              {/* Standard Card Example */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Deliverables</CardTitle>
                  <CardDescription>Status report for the current CRM dashboard design system sprints.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">
                    Our team has achieved 90% of the UI objectives. Visual validation requires reviewing this page on mobile and desktop layout dimensions.
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Sprint Completion</span>
                      <span>90%</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: "90%" }}></div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t border-border pt-4">
                  <Button variant="ghost" size="sm">Cancel</Button>
                  <Button size="sm">View Sprint Details</Button>
                </CardFooter>
              </Card>
            </div>
          </section>

          {/* Section 7: Feedback */}
          <section id="feedback" className="scroll-mt-24 space-y-6">
            <h2 className="text-xl font-bold border-b border-border pb-2">7. Feedback</h2>
            <Card className="p-6 space-y-6">
              <div className="space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Alerts</p>
                <Alert>
                  <HelpCircle className="h-4 w-4 text-primary" />
                  <AlertTitle>Developer Notice</AlertTitle>
                  <AlertDescription>
                    All components listed in this style guide are interactive and bound to mock triggers.
                  </AlertDescription>
                </Alert>

                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Critical Security Alert</AlertTitle>
                  <AlertDescription>
                    Your dev-session will timeout in 1 hour. Please save changes.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sonner Toasts</p>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={showToastSuccess} variant="outline" className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-950 dark:text-green-400">
                    Trigger Success
                  </Button>
                  <Button onClick={showToastInfo} variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-950 dark:text-blue-400">
                    Trigger Info
                  </Button>
                  <Button onClick={showToastError} variant="outline" className="border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-950 dark:text-rose-400">
                    Trigger Error
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Skeletons</p>
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full bg-muted/80" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px] bg-muted/80" />
                    <Skeleton className="h-4 w-[200px] bg-muted/80" />
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* Section 8: Overlays */}
          <section id="overlays" className="scroll-mt-24 space-y-6">
            <h2 className="text-xl font-bold border-b border-border pb-2">8. Overlays</h2>
            <Card className="p-6 space-y-6">
              <div className="flex flex-wrap gap-4">
                {/* Standard Dialog */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">Open Dialog</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Client Profile</DialogTitle>
                      <DialogDescription>
                        Fill in corporate credentials to onboard a software design client.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label htmlFor="styleguide-dialog-name" className="text-sm font-medium">Corporate Legal Name</label>
                        <Input id="styleguide-dialog-name" placeholder="Acme Corp" />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="styleguide-dialog-url" className="text-sm font-medium">Domain URL</label>
                        <Input id="styleguide-dialog-url" placeholder="acme.com" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Create Profile</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Drawer / Sheet */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline">Open Sheet Drawer</Button>
                  </SheetTrigger>
                  <SheetContent side="right">
                    <SheetHeader>
                      <SheetTitle>Audit Logs</SheetTitle>
                      <SheetDescription>
                        Review real-time logs of system calls and database migrations.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-4 text-xs font-mono bg-muted p-4 rounded-lg overflow-y-auto max-h-[70vh]">
                      <p className="text-emerald-500">[21:02:11] DB Connection successful.</p>
                      <p className="text-blue-500">[21:02:15] GET /api/v1/auth/user 200 OK</p>
                      <p className="text-amber-500">[21:02:22] WARN: Deprecated helper called in utils.js</p>
                      <p className="text-rose-500">[21:03:00] ERR: Unhandled reject in socket.io</p>
                    </div>
                  </SheetContent>
                </Sheet>

                {/* ConfirmDialog Trigger */}
                <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
                  Trigger ConfirmDialog
                </Button>
                <ConfirmDialog
                  open={confirmOpen}
                  onOpenChange={setConfirmOpen}
                  title="Delete User Account?"
                  description="This will permanently delete Sarah Connor from the directory database. This action is irreversible."
                  confirmLabel="Yes, Delete Account"
                  cancelLabel="Abort Action"
                  variant="danger"
                  onConfirm={handleConfirmAction}
                />
              </div>
            </Card>
          </section>

          {/* Section 9: Data Table */}
          <section id="data-table" className="scroll-mt-24 space-y-6">
            <h2 className="text-xl font-bold border-b border-border pb-2">9. Data Table</h2>
            <Card className="p-6">
              <DataTable
                columns={columns}
                data={mockUsers}
                searchable={true}
                searchPlaceholder="Search database directory..."
              />
            </Card>
          </section>

          {/* Section 10: Empty State and PageHeader examples */}
          <section id="empty-state-header" className="scroll-mt-24 space-y-6">
            <h2 className="text-xl font-bold border-b border-border pb-2">10. Empty State & PageHeader</h2>
            <div className="space-y-6">
              {/* PageHeader Example */}
              <div className="border border-border p-6 rounded-lg bg-card/40">
                <PageHeader
                  title="Lead Pipeline"
                  subtitle="Manage and qualified sales pipeline opportunities for the 2026 calendar year."
                  breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Sales Pipeline", href: "/leads" },
                    { label: "Active Deals", href: null },
                  ]}
                  actions={
                    <>
                      <Button variant="outline" size="sm">Export Report</Button>
                      <Button size="sm">
                        <Plus className="mr-1.5 h-4 w-4" /> Create Deal
                      </Button>
                    </>
                  }
                />
              </div>

              {/* EmptyState Example */}
              <EmptyState
                title="No active projects assigned"
                description="This developer has currently completed all tasks in their sprint cycle. Assign a new project module to get started."
                action={{
                  label: "Assign Project",
                  onClick: () => toast.info("Project assignment modal triggered!"),
                }}
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
