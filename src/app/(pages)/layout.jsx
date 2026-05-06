"use client"

import Sidebar from "@/components/layout/Sidebar";
import layout from "@/app/(pages)/layout.module.css"
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Front from "./front/page";
import useAIStore from "@/store/aiStore";
// import Front from "@/components/경로/Front";

export default function RootLayout({ children }) {
    const [path, setPath] = useState()
    const url = usePathname();
    let bln = false;

    const [fronOpen, setFrontOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const fetchAll = useAIStore(state => state.fetchAll);

    // 앱 진입 시 AI 분석을 백그라운드에서 미리 호출
    useEffect(() => { fetchAll(); }, []);

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
        switch (url.substring(1)) {
            case 'signup': bln = false; break;
            case 'login': bln = false; break;
            case 'onboarding': bln = false; break;
            default: bln = true;
        }

        setPath(bln)
        setIsMobileMenuOpen(false)
    }, [url])

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
