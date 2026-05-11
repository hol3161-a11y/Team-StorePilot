"use client"

import Sidebar from "@/components/layout/Sidebar";
import layout from "@/app/(pages)/layout.module.css"
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Front from "./front/page";
import useAIStore from "@/store/aiStore";

export default function RootLayout({ children }) {

    const [path, setPath] = useState()
    const url = usePathname();
    let bln = false;

    const { data: session, status } = useSession();
    const ownerId = session?.user?.email
        ?? (typeof window !== 'undefined' ? localStorage.getItem('storePilot.email') : null);

    const [fronOpen, setFrontOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const fetchAll = useAIStore(state => state.fetchAll);

    /* 세션 없으면 /login 페이지로, 공개페이지라면 /login페이지로 돌아가지 않음 */
    const router = useRouter();
    const publicPaths = ['/login', '/signup', '/welcome', '/onboarding'];
    const isPublic = publicPaths.some(p => url.startsWith(p));              // 공개 페이지

    useEffect(() => {
        if (status === 'loading') return;
        if (!session && !isPublic) router.push('/login');
    }, [session, status, isPublic]);

    // 앱 진입 시 AI 분석을 백그라운드에서 미리 호출
    useEffect(() => { fetchAll(ownerId); }, [ownerId]);

    useEffect(() => {
        if (isMobileMenuOpen) {
            const scrollY = window.scrollY;

            document.body.style.position = "fixed";
            document.body.style.top = `-${scrollY}px`;
            document.body.style.left = "0";
            document.body.style.right = "0";
            document.body.style.width = "100%";

            document.body.dataset.scrollY = scrollY;
        } else {
            const scrollY = document.body.dataset.scrollY;

            document.body.style.position = "";
            document.body.style.top = "";
            document.body.style.left = "";
            document.body.style.right = "";
            document.body.style.width = "";

            window.scrollTo(0, Number(scrollY || 0));
        }

        return () => {
            const scrollY = document.body.dataset.scrollY;

            document.body.style.position = "";
            document.body.style.top = "";
            document.body.style.left = "";
            document.body.style.right = "";
            document.body.style.width = "";

            if (scrollY) {
                window.scrollTo(0, Number(scrollY));
            }
        };

    }, [isMobileMenuOpen]);

    useEffect(function () {
        const hiddenPaths = ['/signup', '/login', '/onboarding', '/welcome'];
        bln = !hiddenPaths.some((p) => url === p || url.startsWith(p + '/'));

        setPath(bln)
        setIsMobileMenuOpen(false)
    }, [url])


    /* 세션 확인 중 + 보호된 페이지면 아무것도 렌더하지 않음 (깜빡임 방지) */
    if (status === 'loading' && !isPublic) return null;

    return (
        <div className={`${layout.layout} ${isMobileMenuOpen ? layout.mobileOpen : ""}`}>
            {path && (
                <div className={layout.mobileSidebar}>
                    <Sidebar
                        setFrontOpen={setFrontOpen}
                        frontOpen={fronOpen}
                    />
                </div>
            )}

            <div className={layout.children}>
                {isMobileMenuOpen && (
                    <div
                        className={layout.mobileDim}
                        onClick={() => setIsMobileMenuOpen(false)}
                    ></div>
                )}

                {path && (
                    <header className={layout.mobileHeader}>
                        <button
                            type="button"
                            className={layout.burgerBtn}
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            ☰
                        </button>
                    </header>
                )}

                {children}

                {fronOpen && (
                    <Front onClose={() => setFrontOpen(false)} />
                )}
            </div>
        </div>
    );

}
