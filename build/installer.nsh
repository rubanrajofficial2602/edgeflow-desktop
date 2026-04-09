; Custom NSIS installer script for EdgeFlow ERP
; Adds custom welcome page text and registry entries

!macro customInstall
  ; Register app in Windows Programs
  WriteRegStr HKLM "SOFTWARE\EdgeFlow Technologies\EdgeFlow ERP" "InstallPath" "$INSTDIR"
  WriteRegStr HKLM "SOFTWARE\EdgeFlow Technologies\EdgeFlow ERP" "Version" "${VERSION}"
!macroend

!macro customUninstall
  DeleteRegKey HKLM "SOFTWARE\EdgeFlow Technologies\EdgeFlow ERP"
!macroend
