import { Link, useParams } from "react-router-dom";
import { Button } from "../components/FormComponents";
import { useAdminStore } from "../store/adminStore";
import { useTemplateStore } from "../store/templateStore";
import { useEffect } from "react";
import { useOrderStore } from "../store/orderStore";
export default function Home() {
  const token = (useAdminStore.getState() as any).token;
  const { type } = useParams();
  const pageType = (type as string) || null;
  const { templates, fetchTemplatesByType } = useTemplateStore();
  const setCurrentOrder = useOrderStore((s) => s.setCurrentOrder);

  useEffect(() => {
    if (pageType) fetchTemplatesByType(pageType);
  }, [pageType]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            {pageType
              ? pageType.charAt(0).toUpperCase() + pageType.slice(1)
              : "Welcome to Bookmark Postcards"}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {pageType
              ? `Order custom ${pageType} mailings. Choose a ${pageType} template or upload your own design. Our streamlined process makes it simple to create, review, and approve your ${pageType} orders.`
              : `Order custom postcards easily. Choose a template or upload your own design. Our streamlined process makes it simple to create, review, and approve your postcard orders.`}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              to={
                pageType
                  ? `/order?type=${encodeURIComponent(pageType)}`
                  : "/order"
              }
            >
              <Button className="text-lg px-8 py-3">Start Your Order</Button>
            </Link>
            <Link
              to={
                pageType
                  ? `/templates?type=${encodeURIComponent(pageType)}`
                  : "/templates"
              }
            >
              <Button variant="secondary" className="text-lg px-8 py-3">
                Browse{" "}
                {pageType
                  ? pageType.charAt(0).toUpperCase() + pageType.slice(1)
                  : "Templates"}
              </Button>
            </Link>
            {token && (
              <Link to="/admin">
                <Button variant="secondary" className="text-lg px-8 py-3">
                  Admin Panel
                </Button>
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Easy Design</h3>
              <p className="text-gray-600">
                Choose from templates or upload your own design with our simple
                interface.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Bookmark Postcards</h3>
              <p className="text-gray-600">
                Review your design with our comprehensive checklist before final
                approval.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Fast Processing</h3>
              <p className="text-gray-600">
                Quick approval process with admin oversight for quality
                assurance.
              </p>
            </div>
          </div>

          {/* Contact Support Section */}
          <div className="mt-16 bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-2">Need Help?</h3>
              <p className="text-gray-600 mb-4">
                Our support team is here to assist you with any questions or
                issues.
              </p>
              <a
                href="mailto:support@databaserus.com"
                className="inline-flex items-center gap-2 text-lg text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                support@databaserus.com
              </a>
            </div>
          </div>

          {/* If a pageType is selected, show a small template preview strip */}
          {pageType && templates.length > 0 && (
            <div className="mt-12">
              <h3 className="text-xl font-semibold mb-4">
                Popular {pageType} templates
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {templates.slice(0, 6).map((t) => (
                  <div key={t._id} className="card p-3">
                    {t.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.previewUrl}
                        alt={t.name}
                        className="w-full h-40 object-cover rounded-md mb-2"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400">
                        No preview
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">{t.name}</h4>
                        <p className="text-xs text-gray-500">Size: {t.size}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => {
                            setCurrentOrder({
                              templateId: t._id,
                              designId: t.pcmDesignId || t._id,
                              designName: t.name,
                              isCustomDesign: false,
                            });
                            window.location.href = `/order?step=1&type=${encodeURIComponent(
                              pageType
                            )}`;
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
