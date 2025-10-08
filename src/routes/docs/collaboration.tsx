import { createFileRoute } from "@tanstack/react-router";
import { Users, MessageSquare, Eye, Edit3, CheckCircle, ArrowRight, Clock, UserPlus } from "lucide-react";

export const Route = createFileRoute("/docs/collaboration")({
    component: Collaboration,
});

function Collaboration() {
    const features = [
        {
            icon: Users,
            title: "Team Management",
            description: "Invite team members, assign roles, and manage permissions with granular control.",
            details: [
                "Role-based access control",
                "Team member invitations",
                "Permission management",
                "Activity tracking"
            ]
        },
        {
            icon: MessageSquare,
            title: "Real-time Comments",
            description: "Collaborate on content with threaded comments and suggestions.",
            details: [
                "Threaded discussions",
                "Inline suggestions",
                "Mention notifications",
                "Comment resolution"
            ]
        },
        {
            icon: Eye,
            title: "Review Workflow",
            description: "Set up approval processes with draft reviews and publishing controls.",
            details: [
                "Draft reviews",
                "Approval workflows",
                "Publishing controls",
                "Change tracking"
            ]
        },
        {
            icon: Edit3,
            title: "Live Editing",
            description: "Edit content together in real-time with conflict resolution.",
            details: [
                "Real-time collaboration",
                "Conflict resolution",
                "Change indicators",
                "Auto-save"
            ]
        }
    ];

    const roles = [
        {
            name: "Owner",
            description: "Full access to all features and settings",
            permissions: [
                "Manage team members",
                "Edit all content",
                "Configure settings",
                "Delete projects",
                "Billing management"
            ],
            color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
        },
        {
            name: "Editor",
            description: "Can create, edit, and publish content",
            permissions: [
                "Create and edit articles",
                "Publish content",
                "Manage comments",
                "View analytics",
                "Edit team settings"
            ],
            color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
        },
        {
            name: "Writer",
            description: "Can create and edit content but not publish",
            permissions: [
                "Create and edit articles",
                "Submit for review",
                "Comment on content",
                "View drafts",
                "Edit own content"
            ],
            color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
        },
        {
            name: "Viewer",
            description: "Read-only access to published content",
            permissions: [
                "View published content",
                "Read comments",
                "View analytics",
                "Export content",
                "No editing rights"
            ],
            color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
        }
    ];

    const workflowSteps = [
        {
            step: 1,
            title: "Create Content",
            description: "Writers create drafts and add initial content",
            icon: Edit3,
            details: "Start with a blank document or use AI assistance to generate initial content"
        },
        {
            step: 2,
            title: "Internal Review",
            description: "Team members review and provide feedback",
            icon: MessageSquare,
            details: "Add comments, suggestions, and discuss improvements in real-time"
        },
        {
            step: 3,
            title: "Editor Review",
            description: "Editors review and approve content for publishing",
            icon: Eye,
            details: "Final review and approval before content goes live"
        },
        {
            step: 4,
            title: "Publish",
            description: "Content is published and made available to readers",
            icon: CheckCircle,
            details: "Content goes live and is visible to your audience"
        }
    ];

    const apiExamples = [
        {
            title: "Invite Team Member",
            code: `// Invite a new team member
const invitation = await cortext.team.invite({
  email: "newmember@example.com",
  role: "writer",
  message: "Welcome to our content team!"
});

console.log('Invitation sent:', invitation.id);`
        },
        {
            title: "Add Comment",
            code: `// Add a comment to an article
const comment = await cortext.comments.create({
  articleId: "article_123",
  content: "This section needs more detail about the API endpoints",
  position: {
    blockId: "block_456",
    startOffset: 10,
    endOffset: 25
  }
});`
        },
        {
            title: "Set Review Status",
            code: `// Mark article as ready for review
await cortext.articles.update("article_123", {
  status: "review",
  assignedTo: "editor@example.com"
});

// Approve article for publishing
await cortext.articles.update("article_123", {
  status: "approved",
  approvedBy: "editor@example.com"
});`
        }
    ];

    return (
        <div className="space-y-12">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-4">Team Collaboration</h1>
                <p className="text-lg text-foreground/70">
                    Work together seamlessly with real-time collaboration, review workflows, and team management features designed for modern content teams.
                </p>
            </div>

            {/* Features Overview */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Collaboration Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {features.map((feature, index) => (
                        <div key={index} className="p-6 rounded-xl border hover:border-foreground/20 transition-colors">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-foreground/10 flex items-center justify-center flex-shrink-0">
                                    <feature.icon className="w-5 h-5 text-foreground" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                                    <p className="text-foreground/70 mb-3">{feature.description}</p>
                                    <ul className="space-y-1">
                                        {feature.details.map((detail, detailIndex) => (
                                            <li key={detailIndex} className="flex items-center gap-2 text-sm text-foreground/60">
                                                <CheckCircle className="w-3 h-3 text-green-500" />
                                                {detail}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Team Roles */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Team Roles & Permissions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {roles.map((role, index) => (
                        <div key={index} className="border rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`px-3 py-1 rounded-full text-sm font-medium ${role.color}`}>
                                    {role.name}
                                </div>
                            </div>
                            <p className="text-foreground/70 mb-4">{role.description}</p>
                            <div className="space-y-2">
                                <h4 className="font-medium text-sm text-foreground/80">Permissions:</h4>
                                <ul className="space-y-1">
                                    {role.permissions.map((permission, permIndex) => (
                                        <li key={permIndex} className="flex items-center gap-2 text-sm text-foreground/60">
                                            <CheckCircle className="w-3 h-3 text-green-500" />
                                            {permission}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Workflow */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Content Workflow</h2>
                <div className="space-y-8">
                    {workflowSteps.map((step, index) => (
                        <div key={index} className="flex gap-6">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-full bg-foreground/10 flex items-center justify-center">
                                    <step.icon className="w-6 h-6 text-foreground" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-semibold text-lg">{step.title}</h3>
                                    <span className="px-2 py-1 rounded-full text-xs bg-foreground/10 text-foreground/60">
                                        Step {step.step}
                                    </span>
                                </div>
                                <p className="text-foreground/70 mb-2">{step.description}</p>
                                <p className="text-sm text-foreground/60">{step.details}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Real-time Features */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Real-time Collaboration</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="p-6 rounded-xl border">
                            <h3 className="font-semibold text-lg mb-3">Live Editing</h3>
                            <p className="text-foreground/70 mb-4">
                                See changes as they happen with real-time collaboration indicators and conflict resolution.
                            </p>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <span className="text-foreground/70">User is online</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    <span className="text-foreground/70">Currently editing</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                    <span className="text-foreground/70">Has unsaved changes</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="p-6 rounded-xl border">
                            <h3 className="font-semibold text-lg mb-3">Comment System</h3>
                            <p className="text-foreground/70 mb-4">
                                Threaded discussions with mentions, notifications, and resolution tracking.
                            </p>
                            <div className="space-y-3">
                                <div className="p-3 bg-foreground/5 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium">@john.doe</span>
                                        <span className="text-xs text-foreground/60">2 hours ago</span>
                                    </div>
                                    <p className="text-sm text-foreground/80">This section could use more examples</p>
                                </div>
                                <div className="p-3 bg-foreground/5 rounded-lg ml-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium">@jane.smith</span>
                                        <span className="text-xs text-foreground/60">1 hour ago</span>
                                    </div>
                                    <p className="text-sm text-foreground/80">Good point! I'll add some code examples</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* API Examples */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">API Examples</h2>
                <div className="space-y-6">
                    {apiExamples.map((example, index) => (
                        <div key={index} className="border rounded-xl p-6">
                            <h3 className="font-semibold text-lg mb-4">{example.title}</h3>
                            <div className="rounded-lg border overflow-hidden">
                                <div className="px-4 py-2 bg-foreground/5 border-b text-sm font-medium">
                                    JavaScript SDK
                                </div>
                                <pre className="p-4 text-sm overflow-x-auto">
                                    <code className="text-foreground/80">{example.code}</code>
                                </pre>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Best Practices */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Best Practices</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Team Management</h3>
                        <ul className="space-y-2 text-sm text-foreground/70">
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                Start with minimal permissions and add more as needed
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                Use clear role descriptions and responsibilities
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                Regularly review and update team permissions
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                Set up clear communication channels
                            </li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Content Workflow</h3>
                        <ul className="space-y-2 text-sm text-foreground/70">
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                Establish clear review and approval processes
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                Use comments for feedback, not for major changes
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                Set deadlines and track progress
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                Document your workflow for new team members
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Next Steps */}
            <section className="text-center py-12 bg-foreground/5 rounded-2xl">
                <h2 className="text-2xl font-semibold mb-4">Ready to collaborate?</h2>
                <p className="text-foreground/70 mb-8 max-w-2xl mx-auto">
                    Set up your team and start collaborating on content. Invite team members and establish your workflow today.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-white/90 transition-colors"
                    >
                        Invite Team Members
                        <UserPlus className="w-4 h-4" />
                    </a>
                    <a
                        href="/docs/api"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-medium border hover:bg-foreground/5 transition-colors"
                    >
                        API Reference
                        <ArrowRight className="w-4 h-4" />
                    </a>
                </div>
            </section>
        </div>
    );
}
