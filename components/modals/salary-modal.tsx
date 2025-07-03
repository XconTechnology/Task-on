"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DollarSign, Save, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { workspaceApi } from "@/lib/api"
import type { WorkspaceMember } from "@/lib/types"

interface SalaryModalProps {
  isOpen: boolean
  onClose: () => void
  member: WorkspaceMember | undefined
  onSuccess: () => void
}

const currencies = [
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "PKR", label: "PKR (RS)", symbol: "RS" },

  { value: "EUR", label: "EUR (€)", symbol: "€" },
  { value: "GBP", label: "GBP (£)", symbol: "£" },
  { value: "CAD", label: "CAD (C$)", symbol: "C$" },
  { value: "AUD", label: "AUD (A$)", symbol: "A$" },
  { value: "JPY", label: "JPY (¥)", symbol: "¥" },
]

export default function SalaryModal({ isOpen, onClose, member, onSuccess }: SalaryModalProps) {
  const { toast } = useToast()
  const [amount, setAmount] = useState(member?.salary?.amount?.toString() || "")
  const [currency, setCurrency] = useState(member?.salary?.currency || "USD")
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    if (!member || !amount || isNaN(Number(amount))) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid salary amount",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await workspaceApi.updateMemberSalary(member.memberId, {
        amount: Number(amount),
        currency,
      })

      if (response.success) {
        toast({
          title: "Salary updated",
          description: `${member.username}'s salary has been updated successfully`,
          variant: "default",
        })
        onSuccess()
        onClose()
      } else {
        toast({
          title: "Failed to update salary",
          description: response.error || "An error occurred while updating the salary",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to update salary:", error)
      toast({
        title: "Failed to update salary",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedCurrency = currencies.find((c) => c.value === currency)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span className="text-large">Update Salary</span>
          </DialogTitle>
          <DialogDescription className="text-xs">Set the monthly salary for {member?.username}</DialogDescription>
        </DialogHeader>

        {member && (
          <div className="flex items-center space-x-4 py-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={member.profilePictureUrl || "/placeholder.svg"} />
              <AvatarFallback>{member.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-medium">{member.username}</p>
              <p className="text-small text-gray-500">{member.email}</p>
              <p className="text-medium text-gray-400">
                Current:{" "}
                {member.salary
                  ? `${selectedCurrency?.symbol}${member.salary.amount.toLocaleString()} ${member.salary.currency}`
                  : "No salary set"}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-sm">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr.value} value={curr.value}>
                      <p className="text-medium">{curr.label}</p>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Monthly Salary</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                  {selectedCurrency?.symbol}
                </span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8"
                  min="0"
                  step="100"
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Salary Information</p>
                <ul className="text-xs text-blue-700 mt-1 space-y-1">
                  <li>• This salary is specific to this workspace</li>
                  <li>• Only admins and owners can view salary information</li>
                  <li>• Changes are tracked with timestamps</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !amount}>
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                <span>Updating...</span>
              </div>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                <span>Update Salary</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
